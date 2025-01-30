const {DefaultArtifactClient} = require('@actions/artifact')
const core = require('@actions/core');
const fs = require('fs');
const yaml = require('js-yaml');

function loadValue(key, value) {
  if (key === 'cpu' || key === 'memory') {
    return String(JSON.parse(value));
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

function getPath(baseData, jsonRoute) {
  let position = baseData;
  for (let i = 0; i < jsonRoute.length - 1; i++) {
    position = position[jsonRoute[i]];
  }
  return position;
}

async function generateJsonFiles() {
  try {
    const baseFile = core.getInput('base_file');
    const valuesFile = core.getInput('values_file');

    const container_image = core.getInput('container_image');
    const dd_version_value = core.getInput('dd_version');
    const dd_version_block = {
      name: 'DD_VERSION',
      value: dd_version_value,
    };

    const replaceRoutes = {
      family: ['family'],
      memory: ['memory'],
      cpu: ['cpu'],
      taskRoleArn: ['taskRoleArn'],
      container_name: ['containerDefinitions', 0, 'name'],
      command: ['containerDefinitions', 0, 'command'],
      log_group: ['containerDefinitions', 0, 'logConfiguration', 'options', 'awslogs-group'],
      portMappings: ['containerDefinitions', 0, 'portMappings'],
      dd_service: ['containerDefinitions', 0, 'logConfiguration', 'options', 'dd_service'],
    };

    const baseData = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
    const taskData = yaml.load(fs.readFileSync(valuesFile, 'utf8'));

    for (const container in taskData) {
      const values = taskData[container];
      for (const key in values) {
        const value = values[key];

        if (key === 'have_nginx') {
          if (!value) {
            baseData.containerDefinitions.splice(1, 1);
          }
          continue;
        }
        let position = baseData;
        const jsonRoute = replaceRoutes[key];

        if (Array.isArray(jsonRoute)) {
          const position = getPath(baseData, jsonRoute);
          position[jsonRoute[jsonRoute.length - 1]] = loadValue(key, value);
        } else {
          console.error(`Path not defined for the key: ${key}`);
        }
      }

      baseData.containerDefinitions[0].image = container_image !== "" ? container_image : baseData.containerDefinitions[0].image;

      if (dd_version_value !== "") {
        baseData.containerDefinitions[0].environment.push(dd_version_block);
      }

      fs.writeFileSync(`${container}.json`, JSON.stringify(baseData, null, 2));
    }


    const artifactName = 'generated-json-files';
    const filesToUpload = fs.readdirSync('.', { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
      .map(dirent => "./" + dirent.name);
    console.log(artifactName);
    console.log(filesToUpload);

    const artifact = new DefaultArtifactClient()
    await artifact.uploadArtifact(artifactName, filesToUpload).catch(error => {
      core.setFailed(`Error uploading artifact: ${error}`);
    });

  } catch (error) {
    core.setFailed(`Error generating JSON files: ${error}`);
  }
}

generateJsonFiles();
