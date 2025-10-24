const XLSX = require('xlsx');
const fs = require('fs');
const yaml = require('js-yaml');

async function xlsxToBackstageYaml(xlsxFilePath, yamlFilePath) {
  try {

    // Check if file exists
    if (!fs.existsSync(xlsxFilePath)) {
      throw new Error(`File not found: ${xlsxFilePath}`);
    }

    // Read the XLSX file using xlsx library
    const workbook = XLSX.readFile(xlsxFilePath);

    // Check if workbook has sheets
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('No worksheets found in the XLSX file');
    }

    // Use the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Found ${data.length} rows of data`);

    if (data.length === 0) {
      throw new Error('No data found in the worksheet');
    }

    const entities = [];

    data.forEach((row, index) => {

      // Process each row
      const rowData = {};

      // Convert all values to strings and handle undefined values
      Object.keys(row).forEach(key => {
        rowData[key] = row[key] !== null && row[key] !== undefined
          ? String(row[key]).trim()
          : '';
      });


      // Skip if no name
      if (!rowData['End User Offering Name'] || rowData['End User Offering Name'].trim() === '') {
        console.warn(`Skipping row ${index + 1}: No name provided`);
        return;
      }

      if (rowData.hasOwnProperty('Department') && rowData.Department == "BD/PA-TO") {
        // Create Backstage entity
        const entity = {
          apiVersion: 'backstage.io/v1alpha1',
          kind: rowData.Kind || 'Component',
          metadata: {
            name: NamingConvention(rowData['End User Offering Name']),
            title: rowData['End User Offering Name'],
            description: rowData['Taxonomy Node (VM L3)'] || '',
            annotations: {},
            labels: {
              'visibility': rowData.Visibility
            },
            tags: ["BDC"]
          },
          spec: {
            type: rowData.type || 'service',
            lifecycle: rowData.lifecycle || 'production',
            owner: rowData['Owned by'] || 'BDC',
            department: rowData.Department
          }
        };

        // Handle annotations
        if (rowData.annotations && rowData.annotations.trim() !== '') {
          try {
            entity.metadata.annotations = JSON.parse(rowData.annotations);
          } catch (error) {
            console.warn(`Invalid JSON in annotations for ${rowData.name}, using key-value parsing`);
            entity.metadata.annotations = parseKeyValuePairs(rowData.annotations);
          }
        }

        // Handle labels - merge custom labels with defaults
        if (rowData.labels && rowData.labels.trim() !== '') {
          try {
            const customLabels = JSON.parse(rowData.labels);
            entity.metadata.labels = { ...entity.metadata.labels, ...customLabels };
          } catch (error) {
            console.warn(`Invalid JSON in labels for ${rowData.name}, using key-value parsing`);
            const customLabels = parseKeyValuePairs(rowData.labels);
            entity.metadata.labels = { ...entity.metadata.labels, ...customLabels };
          }
        }

        // Handle other optional fields
        if (rowData.system && rowData.system.trim() !== '') entity.spec.system = rowData.system;
        if (rowData.domain && rowData.domain.trim() !== '') entity.spec.domain = rowData.domain;
        entities.push(entity);
      }
    });

    if (entities.length === 0) {
      throw new Error('No valid entities created from the data');
    }

    // Convert to YAML
    const yamlContent = entities.map(entity =>
      yaml.dump(entity, { noRefs: true })
    ).join('---\n');

    // Write to file
    fs.writeFileSync(yamlFilePath, yamlContent);
    console.log(`✅ Successfully converted ${entities.length} entities to Backstage YAML: ${yamlFilePath}`);

  } catch (error) {
    console.error('❌ Error converting XLSX to YAML:', error.message);
  }
}

function parseKeyValuePairs(str) {
  const result = {};
  try {
    const pairs = str.split(',').map(pair => pair.trim());
    pairs.forEach(pair => {
      const [key, value] = pair.split('=').map(part => part.trim());
      if (key && value !== undefined) {
        result[key] = value;
      }
    });
  } catch (error) {
    console.warn('Error parsing key-value pairs:', str);
  }
  return result;
}

// Function to convert name to no spaces (replace spaces with hyphens)
function NamingConvention(name) {
  return name
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9-]/g, '') // Remove special characters except hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .toLowerCase(); // Convert to lowercase for consistency
}


// Usage
xlsxToBackstageYaml('offering_information.xlsx', 'output.yaml');

