# generate-task-definition-file

## Inputs

### `base_file`

**Required** Name of the JSON file used as a base file for generate the task definitions files.

### `values_file`

**Required** Name of the yml file that contain the values replaced on the task definitions.

### `dd_version`

**Required** Commit hash used as datadog version value


## Example usage

```yaml
uses: MigranteSF/generate-task-definition-file@v1
with:
  base_file: '.aws/dev-task-definition.json'
  values_file: '.aws/dev-values.yml'
  dd_version: ${{ github.sha }}
```

## Development

Node Version: 16

For the development and update of the Action, after modifying the `index.js` file it is necessary to compile it so that it is uploaded together with all the necessary packages using the following command:

```
ncc build index.js
```
After this, the action itself uses the generated `dist/index.js` file, but it is necessary to upload both the `dist/index.js` file and the `index.js` file.
