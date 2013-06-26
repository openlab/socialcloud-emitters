var config = require("./config");

exports.config = {
  /**
   * Array of application names.
   */
  app_name : ['Social Cloud Emitter'],
  /**
   * Your New Relic license key.
   */
  license_key : config.newRelicKey,
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'trace'
  }
};
