#!/usr/bin/env node

'use strict'

var cli = require('cli'),
    Table = require('cli-table'),
    config = require('./config'),
    _ = require('lodash');

var dynoHash = {}, urlHash = {}, modeHash = {}, responseTime = [];

cli.enable('help', 'version', 'status');

console.log('\nCreating hasmaps');
cli.progress(0);

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

  cli.output('\nDynos ( Dyno that responded most ---> '+ maxDynoName +' ):');
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
  var sortedResponseTime = responseTime.sort(function(a,b) {return a-b;});
  var meanResponseTime = _.sum(sortedResponseTime) / sortedResponseTime.length;
  cli.info('Mean: ' + meanResponseTime);
  
  var middle = sortedResponseTime.length / 2;
  if(sortedResponseTime.length % 2 === 1) {
    cli.info('Median: ' + sortedResponseTime[middle]);
  } else {
    cli.info('Median: ' + (sortedResponseTime[middle - 1] + sortedResponseTime[middle] ) / 2);
  }
  
  var maxOccurance = _.values(modeHash).sort(function(a,b) {return b-a;});
  console.log(modeHash);
  cli.info('Mode: ' + _.findKey(modeHash, maxOccurance));

    
}

function pushOrIncr(obj, item) {
  if(item in obj) {
    obj[item] = obj[item] + 1;
  } else {
    obj[item] = 1;
  }
}
