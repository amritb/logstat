#!/usr/bin/env node

'use strict'

var cli = require('cli'),
    Table = require('cli-table'),
    config = require('./config'),
    _ = require('lodash');

var dynoHash = {}, urlHash = {}, modeHash = {}, responseTime = [];

cli.enable('help', 'version', 'status');

console.log('\nCreating hasmaps');
cli.progress(0.05);

cli.withStdinLines(function(lines, newline) {
  
  cli.progress(0.3);

  lines.forEach(function(item, index) {
    var lineSplitted = item.split(" "); 
    var urlWithMethod = lineSplitted[3].substring(7) + ' '  + lineSplitted[4].substring(5).replace(/\d+/g, config.URL_PLACEHOLDER); 
    var resTime = parseInt(lineSplitted[8].substring(8).split("ms")[0]) + parseInt(lineSplitted[9].substring(8).split("ms")[0]);

    if(config.URL_FILTERS.indexOf(urlWithMethod) !== -1) {
      responseTime.push(resTime); 
      pushOrIncr(dynoHash, lineSplitted[7].substring(5));
      pushOrIncr(urlHash, urlWithMethod);
      pushOrIncr(modeHash, resTime);
    }
    var progress = (((index / lines.length) * 70) / 100) + 0.3;

    cli.progress(progress);

    if(index === lines.length - 1) {
      cli.progress(1);
      cli.ok('Hashmaps created');
      showResults();
    }
  });
});

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
  dataTable.push(['mean', mean + 'ms']);
  dataTable.push(['median', median + 'ms']);
  dataTable.push(['mode', mode + 'ms (occured ' + highestOccurance + ' times)']);
  dataTable.push(['max dyno', maxDynoName]);
  cli.output('\nCalculations:');
  cli.output(dataTable.toString());
}

function pushOrIncr(obj, item) {
  if(item in obj) {
    obj[item] = obj[item] + 1;
  } else {
    obj[item] = 1;
  }
}
