#!/usr/bin/env node
/**
 * A CLI tool using node-cli to analyse server logs
 */

'use strict'

var cli = require('cli'),
    Table = require('cli-table'),
    config = require('./config'),
    _ = require('lodash');

var dynoHash = {}, urlHash = {}, modeHash = {}, responseTime = [];

// Enabling required cli plugins
cli.enable('help', 'version', 'status');

// Set the required PATH option
var options = cli.parse({
  path: ['p', 'Path of the log file', 'path']
});

if(!options.path) {
  cli.error('Please provide PATH of the log file');
  process.exit(1);
}

console.log('\nCreating hasmaps');
cli.progress(0.05);

// Iterate through each line of the log file and create hashmap
cli.withInput(options.path, function(item, newline, eof) {

  if(eof){ 
    cli.progress(1);
    cli.ok('Hashmaps created');
    showResults();
    return;
  }

  cli.progress(0.3);

  var lineSplitted = item.split(" "); 
  // Save urls with this pattern: GET /api/users/{user_id}/....
  var urlWithMethod = lineSplitted[3].substring(7) + ' '  + lineSplitted[4].substring(5).replace(/\d+/g, config.URL_PLACEHOLDER); 
  // Calculate response time
  var resTime = parseInt(lineSplitted[8].substring(8).split("ms")[0]) + parseInt(lineSplitted[9].substring(8).split("ms")[0]);

  // Process the log only if its amoung the given URLs
  if(config.URL_FILTERS.indexOf(urlWithMethod) !== -1) {
    responseTime.push(resTime); 
    pushOrIncr(dynoHash, lineSplitted[7].substring(5));
    pushOrIncr(urlHash, urlWithMethod);
    pushOrIncr(modeHash, resTime);
  }
});

/**
 * Generates the output
 */
function showResults() {

  // Dyno table
  var dynoTable = new Table({
      head: ['Dyno', 'Hits']
  });

  var maxDyno = 0, maxDynoName = '';
  _.forOwn(dynoHash, function(item, index) {
    if(maxDyno < item) {
      maxDyno = item;
      maxDynoName = index;
    }
    dynoTable.push([ index , item ]);
  });

  cli.output('\nDynos:');
  cli.output(dynoTable.toString());

  // URL table
  var urlTable = new Table({
      head: ['URL', 'Hits']
  });

  _.forOwn(urlHash, function(item, index) {
    urlTable.push([ index, item ]);
  });

  cli.output('\nURLs:')
  cli.output(urlTable.toString());

  // Calculating mean, median, mode
  var mean, median, mode;
  var sortedResponseTime = responseTime.sort(function(a,b) {return a-b;});
  var mean = _.sum(sortedResponseTime) / sortedResponseTime.length;
  
  var middle = sortedResponseTime.length / 2;
  if(sortedResponseTime.length % 2 === 1) {
    median = sortedResponseTime[middle];
  } else {
    median = (sortedResponseTime[middle - 1] + sortedResponseTime[middle] ) / 2;
  }
  
  var highestOccurance = 0, highestOccuranceResTime = 0;
  _.forOwn(modeHash, function(item, index){
    if(modeHash[index] > highestOccurance) {
      highestOccurance = modeHash[index];
      highestOccuranceResTime = index;
    }
  });
  mode = highestOccuranceResTime;
  
  var dataTable = new Table({
    head: ['Operation', 'Value']
  });
  dataTable.push(['mean', mean + ' ms']);
  dataTable.push(['median', median + ' ms']);
  dataTable.push(['mode', mode + ' ms (occured ' + highestOccurance + ' times)']);
  dataTable.push(['max dyno', maxDynoName]);
  cli.output('\nCalculations:');
  cli.output(dataTable.toString());
}

/**
 * If the item exists in object, increament the count
 * else push the new value.
 */
function pushOrIncr(obj, item) {
  if(item in obj) {
    obj[item] = obj[item] + 1;
  } else {
    obj[item] = 1;
  }
}
