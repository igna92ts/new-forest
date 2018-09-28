const fs = require('fs');

let yaml = `
service: test-service # NOTE: update this with your service name

provider:
  name: aws
  runtime: nodejs8.10

plugins:
  - serverless-offline

functions:`;

const awsFunction = number => {
  return `
  createTree${number}:
    handler: handler.createTree
    events:
      - http:
          path: create_tree${number}
          method: post
          cors: true `;
};

const buildYaml = () => {
  for (let i = 1; i <= 128; i++) {
    yaml += awsFunction(i);
  }
  return yaml;
};

fs.writeFile('serverless.yml', buildYaml(), err => {
  if (err) return console.log(err);
  console.log('FILE SAVED');
});
