// 測試使用json字串來存取設定資料
// 設定檔案寫在file1.js
json_string = `
{
  "setting1": "value1",
  "setting2": true,
  "servers": [
    {
      "name": "main",
      "url": "https://example.com/api",
      "active": true
    },
    {
      "name": "backup",
      "url": "https://backup.example.com/api",
      "active": false
    }
  ],
  "features": {
    "enableLogin": true,
    "maxUsers": 100,
    "roles": ["admin", "editor", "viewer"],
    "advancedOptions": {
      "debugMode": false,
      "maintenance": {
        "enabled": true,
        "window": "02:00-04:00"
      }
    }
  }
}
`;
const CONFIG_DATA = JSON.parse(json_string);

function getConfigData() {
  return CONFIG_DATA;
}


// 可以在其他js檔案中呼叫 getConfigData() 來存取 CONFIG_DATA
function myLoginLogic() {
  const config = getConfigData();

  // Log all main settings
  Logger.log('Setting 1: ' + config.setting1);
  Logger.log('Setting 2: ' + config.setting2);

  // Log server information
  if (Array.isArray(config.servers)) {
    config.servers.forEach((server, idx) => {
      Logger.log(`Server[${idx}]: ${server.name}, URL: ${server.url}, Active: ${server.active}`);
    });
  }

  // Log feature settings
  Logger.log('Login enabled: ' + config.features.enableLogin);
  Logger.log('Max users: ' + config.features.maxUsers);
  Logger.log('Available roles: ' + config.features.roles.join(', '));

  // Advanced options
  if (config.features.advancedOptions) {
    Logger.log('Debug Mode: ' + config.features.advancedOptions.debugMode);
    const maintenance = config.features.advancedOptions.maintenance;
    if (maintenance) {
      Logger.log('Maintenance enabled: ' + maintenance.enabled);
      Logger.log('Maintenance window: ' + maintenance.window);
    }
  }

  // Example: Check if login is enabled and print result
  if (config.features.enableLogin) {
    Logger.log('Login feature is ENABLED');
  } else {
    Logger.log('Login feature is DISABLED');
  }

  // Example: Find active server
  const activeServer = config.servers.find(server => server.active);
  if (activeServer) {
    Logger.log('Active server is: ' + activeServer.name + ' (' + activeServer.url + ')');
  } else {
    Logger.log('No active server found.');
  }
}
