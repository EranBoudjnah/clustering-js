var cluster = (function () {
  var cache = {}
  var defaults = {
    COLORS: [
      "#FF0000", "#00FF00", "#0000FF", "#FF00FF",
      "#33AA88", "#FF8800", "#0088FF", "#003333",
      "#AA00AA", "#8800FF"
    ],
    ITEMS_COUNT: 10000,
    CLUSTER_COUNT: 10,
    MAX_STEPS: 500,
    MAX_TIME_SECONDS: 200.0,
    INTERVAL: 1,
    RANDOM_FUNCTION: function (field) {
      return Math.round(Math.random() * 600) + 2;
    },
    FINISH_FUNCTION: function (initTime, clusteringTime, executedSteps) {
      alert(initTime.toFixed(2) + " seconds: initialization time.\n" +
      clusteringTime.toFixed(2) + " seconds: clustering time.\n" +
      (initTime + clusteringTime).toFixed(2) + " seconds: total execution time.\n" +
      executedSteps + " steps executed.");
    },
    NEW_CLUSTER_ENTITY_FUNCTION: function (index, cache) {
      var getClusterStyle = function(colorIndex) {
        var color = settings.colors[colorIndex];
        return {
          position: "absolute",
          display: "block",
          color: color,
          border: "1px solid " + color
        };
      };
    
      var clustersDiv = cache.clustersDiv || $("#clusters");
      cache.clustersDiv = clustersDiv;
      var div = $("<div><\/div>");
      clustersDiv.append(div);
      return div.css(getClusterStyle(index - 1))
        .text(index + 1)
        .attr("id", "c" + index);
    },
    UPDATE_CLUSTER_ENTITY_FUNCTION: function (entity, x, y, count) {
      entity
        .css({
          left: Math.round(x) - entity.width() / 2,
          top: Math.round(y) - entity.height() / 2
        })
        .text(count);
    },
    NEW_ITEM_ENTITY_FUNCTION: function (initialClusterId, itemId, item, cache) {
      var newStyleForItem = function(item, color) {
        return {
          position: "absolute",
          left: item.x,
          top: item.y,
          color: color
        };
      };

      var itemsDiv = cache.itemsDiv || $("#points");
      cache.itemsDiv = itemsDiv;

      var div = $("<div><\/div>");
      itemsDiv.append(div);
      var color = settings.colors[initialClusterId]
      return div.css(newStyleForItem(item, color))
        .text("o")
        .attr("id", itemId);
    },
    UPDATE_ITEM_ENTITY_FUNCTION: function (item) {
      item.entity.css("color", settings.colors[item.clusterId]);
    },
    BEFORE_STEP_FUNCTION: function (step, isLastStep) {
    },
    FIELDS: ["x", "y"]
  };

  var items;
  var clusters;

  var settings = {};

  var interval = 0;
  var startTime = 0;
  var initCompleteTime = 0;
  var executedSteps;

  var valueIfArray = function(value) {
    return Array.isArray(value) && value;
  };

  var valueIfPositiveInteger = function(value) {
    return value && value.toString().match(/^[1-9]\d*$/) && parseInt(value, 10);
  };

  var valueIfInteger = function(value) {
    return value === 0 ||
      (value && value.toString().match(/^-?\d+$/) && parseInt(value, 10));
  };

  var valueIfFunction = function(value) {
    var getType = {};
    return value &&
      getType.toString.call(value) === "[object Function]" &&
      value;
  };

  var initSettings = function(customSettings) {
    if (!customSettings || typeof customSettings !== "object") {
      customSettings = {};
    }

    settings.colors =
      valueIfArray(customSettings.colors) ||
      defaults.COLORS;
    settings.itemsCount =
      valueIfPositiveInteger(customSettings.itemsCount) ||
      defaults.ITEMS_COUNT;
    settings.clustersCount =
      valueIfPositiveInteger(customSettings.clustersCount) ||
      defaults.CLUSTER_COUNT;
    settings.maxSteps =
      valueIfInteger(customSettings.maxSteps) ||
      defaults.MAX_STEPS;
    settings.maxTimeSeconds =
      Number(customSettings.maxTimeSeconds) ||
      defaults.MAX_TIME_SECONDS;
    settings.interval =
      Number(customSettings.interval) ||
      defaults.INTERVAL;
    settings.randomFunction =
      valueIfFunction(customSettings.randomFunction) ||
      defaults.RANDOM_FUNCTION;
    settings.finishFunction =
      valueIfFunction(customSettings.finishFunction) ||
      defaults.FINISH_FUNCTION;
    settings.updateClusterEntityFunction =
      valueIfFunction(customSettings.updateClusterEntityFunction) ||
      defaults.UPDATE_CLUSTER_ENTITY_FUNCTION;
    settings.newClusterEntityFunction =
      valueIfFunction(customSettings.newClusterEntityFunction) ||
      defaults.NEW_CLUSTER_ENTITY_FUNCTION;
    settings.newItemEntityFunction =
      valueIfFunction(customSettings.newItemEntityFunction) ||
      defaults.NEW_ITEM_ENTITY_FUNCTION;
    settings.updateItemEntityFunction =
      valueIfFunction(customSettings.updateItemEntityFunction) ||
      defaults.UPDATE_ITEM_ENTITY_FUNCTION;
    settings.beforeStepFunction =
      valueIfFunction(customSettings.beforeStepFunction) ||
      defaults.BEFORE_STEP_FUNCTION;
    settings.fields = 
      valueIfArray(customSettings.fields) ||
      defaults.FIELDS;
  };

  var newCluster = function (entity) {
    return { count: 0, x: 0, y: 0, sumX: 0, sumY: 0, entity: entity };
  };

  var initClusters = function(clustersCount) {
    var clusterEntity;

    var newClusterEntityFunction = settings.newClusterEntityFunction;
    while (clusters.length < clustersCount) {
      clusterEntity = newClusterEntityFunction(clusters.length + 1, cache);
      clusters.push(newCluster(clusterEntity));
    }
  };

  var newRandomItem = function(clusterId, randomFunc) {
    var randomItem = { clusterId: clusterId };
    var fields = settings.fields;
    var field;

    fields.forEach(function (field) {
      randomItem[field] = randomFunc(field);
    });

    return randomItem;
  };

  var initItems = function(randomFunc) {
    var itemId;
    var clusterId;
    var item;
    var entity;
    var curCluster;
    var clustersCount = settings.clustersCount;
    var itemsCount = settings.itemsCount;

    while (items.length < itemsCount) {
      itemId = items.length + 1;
      // Assign an item to each cluster to divide them evenly.
      clusterId = itemId % clustersCount;
      item = newRandomItem(clusterId, randomFunc);
      entity = settings.newItemEntityFunction(clusterId, "p" + itemId, item, cache);
      item.entity = entity;
      items.push(item);

      curCluster = clusters[clusterId];
      // Update the items average formula components for the cluster
      ++curCluster.count;
      curCluster.sumX += item.x;
      curCluster.sumY += item.y;
    }
  };

  var reCluster = function() {
    var moved = 0;
    var itemCluster;
    var dX;
    var dY;
    var minDist;
    var newDist;
    var currentClusterId;
    var targetCluster;
    var targetClusterId;

    items.forEach(function (item) {
      currentClusterId = item.clusterId;
      itemCluster = clusters[currentClusterId];
      // If the cluster only has one item left - don't re-assign the item.
      // Otherwise, we lose that cluster.
      if (itemCluster.count <= 1) {
        return;
      }

      dX = item.x - itemCluster.x;
      dY = item.y - itemCluster.y;

      // Store current distance from center of cluster.
      // We're not using Sqrt as it's not required for relative comparisons.
      minDist = dX * dX + dY * dY;

      targetCluster = false;
      clusters.forEach(function (visitedCluster, visitedClusterId) {
        if (visitedCluster === itemCluster) {
          return;
        }

        dX = item.x - visitedCluster.x;
        dY = item.y - visitedCluster.y;
        // Get distance from center of the new cluster.
        // We're not using Sqrt as it's not required for relative comparisons.
        newDist = dX * dX + dY * dY;
        if (newDist < minDist) {
          minDist = newDist;
          targetCluster = visitedCluster;
          targetClusterId = visitedClusterId;
        }
      });

      if (targetCluster) {
        // Update the items average formula components for the old cluster
        itemCluster.count += -1;
        itemCluster.sumX += -item.x;
        itemCluster.sumY += -item.y;

        item.clusterId = targetClusterId;
        settings.updateItemEntityFunction(item);

        // Update our pointer to the new cluster
        itemCluster = targetCluster;
        // Update the items average formula components for the new cluster
        ++itemCluster.count;
        itemCluster.sumX += item.x;
        itemCluster.sumY += item.y;

        ++moved;
      }
    });

    if (moved) {
      calcClusters();
    }

    return moved;
  };

  var clusterStep = function() {
    // Reassign all items to clusters and report if any items moved.
    settings.beforeStepFunction(executedSteps, false);
    var moved = reCluster();
    ++executedSteps;
    var finishedTime = Date.now()
    var initTime = (initCompleteTime - startTime) / 1000;
    var totalTime = (finishedTime - startTime) / 1000;
    var clusteringTime = totalTime - initTime;

    // Comment the following two lines to skip updates during the process
    // and speed things up.
    positionClusters();

    // If we're done or hit one of our set limits, stop.
    if (!moved ||
        executedSteps === settings.maxSteps ||
        totalTime >= settings.maxTimeSeconds) {
      clearInterval(interval);
      interval = 0;

      // Update the results to screen.
      settings.beforeStepFunction(executedSteps, true);
      updateItemEntities();
      positionClusters();

      setTimeout(function () {
        settings.finishFunction(initTime, clusteringTime, executedSteps);
      }, 1);
      return false;
    } else {
      return true;
    }
  };

  var calculateClusters = function() {
    clusters.forEach(function (curCluster) {
      curCluster.x = curCluster.sumX / curCluster.count;
      curCluster.y = curCluster.sumY / curCluster.count;
    });
  };

  var updateItemEntities = function() {
    items.forEach(function (item) {
      settings.updateItemEntityFunction(item);
    });
  };

  var positionClusters = function() {
    clusters.forEach(function (curCluster) {
      settings.updateClusterEntityFunction(curCluster.entity, curCluster.x, curCluster.y, curCluster.count);
    });
  };

  var initClustering = function() {
    if (interval) {
      clearInterval(interval);
      interval = 0;
    }
    startTime = Date.now();
    executedSteps = 0;
    items = [];
    clusters = [];
  };

  var timeInitComplete = function() {
    initCompleteTime = Date.now();
  }

  return {
    start: function (customSettings) {
      initClustering();
      initSettings(customSettings);
      initClusters(settings.clustersCount);
      initItems(settings.randomFunction);
      calculateClusters();
      positionClusters();
      timeInitComplete();

      if (clusterStep()) {
        interval = setInterval(clusterStep, settings.interval);
      }
    }
  };
}());

