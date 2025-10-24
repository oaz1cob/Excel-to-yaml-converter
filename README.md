# Excel to YAML Converter for Backstage
A Node.js tool to convert Excel (.xlsx) files to Backstage-compatible YAML format for catalog entities.

## Features
- 📊 Convert Excel files to Backstage YAML format
- 🏷️ Automatic department filtering (BD/PA-TO & SW4)
- 🔤 Smart name conversion (spaces to hyphens)
- 📝 Support for annotations and custom labels
- ✅ Backstage entity validation

## Installation
1. Clone or download this project
2. Install dependencies:
```bash
    npm install xlsx js-yaml
```
## Usage
### Basic Conversion
```bash
npm start
```
This will convert `usergiven.xlsx` to `output.yaml` with default settings.

### Custom File Names
Modify the last line in `index.js`:
```bash
xlsxToBackstageYaml('your-input-file.xlsx', 'your-output-file.yaml');
```
### Excel File Format
Your Excel file should have the following columns:
| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| name | ✅ | Component name | `My Web Application` |
| department | ✅ | Must be "BD/PA-TO" | `BD/PA-TO` & `BD/TOA-SWE4` |
| kind | ❌ | Entity kind (default: Component) | `Component` |
| description | ❌ | Component description | `Frontend web app` |
| type | ❌ | Component type (default: service) | `service` |
| owner | ❌ | Owner team (default: unknown) | `BDC` |
| lifecycle | ❌ | Lifecycle stage (default: production) | `production` |
| system | ❌ | Parent system |  |
| domain | ❌ | Business domain |  |
| annotations | ❌ | JSON string of annotations | `{}` |
| labels | ❌ | JSON string of custom labels | `{"visibility":""}` |

### Output Format
The converter generates Backstage catalog entities in YAML format:

```bash
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: web-application
  description: Frontend app
  annotations: {}
  labels:
    visibility: 'public'
  psm: user:user-1
spec:
  type: website
  lifecycle: production
  owner: team-a
---
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: api-service
  description: Backend API
  annotations: {}
  labels:
    visibility: 'private'
  psm: user:user-2
spec:
  type: service
  lifecycle: production
  owner: team-b
```

### Name Conversion
The tool automatically converts component names to be Backstage-friendly:

- Original: `My Web Application`
- Converted: `my-web-application`

Rules applied:

- Spaces replaced with hyphens
- Special characters removed
- Converted to lowercase
- Multiple spaces/hyphens collapsed

### Department Filtering
Only rows with department `BD/PA-TO` & `BD/TOA-SWE4` are processed. Other departments are skipped.

## Customization
### Change Department Filter
Modify the filter condition:
```bash
if (rowData.Department && rowData.Department === 'YOUR-DEPARTMENT') {
  // Process row
}
```

## Error Handling
The tool provides detailed logging:
- ✅ Success messages with entity counts
- ⚠️ Warnings for invalid JSON in annotations/labels
- ❌ Error messages for file issues
- 📊 Department filtering statistics

## Dependencies
- `xlsx`: Excel file parsing
- `js-yaml`: YAML generation

## Support
For issues or questions:

1. Check that your Excel file follows the required format
2. Verify all dependencies are installed
3. Check the console output for specific error messages

### Example Workflow
1. Prepare your Excel file with component data
2. Ensure all target rows have department "BD/PA-TO"
3. Run the converter: node index.js
4. Check the generated output.yaml file
5. Import into Backstage catalog
