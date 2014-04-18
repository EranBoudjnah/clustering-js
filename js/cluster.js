var cluster = {
  consts: {
           COLORS: ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#33AA88', '#FF8800', '#0088FF', '#003333', '#AA00AA', '#8800FF'],
     POINTS_COUNT: 10000,
    CLUSTER_COUNT: 10,
        MAX_STEPS: 500,
     MAX_TIME_SEC: 200.0,
    INTERVAL_STEP: 1
  },
  points: [],
  clusters: [],
  ivl: 0,
  startTime: 0,
  steps: 0,

  initClusters: function() {
    var clustersDIV = $('#clusters');

    for (var i = cluster.consts.CLUSTER_COUNT - 1; i >= 0; i += -1) {
      var div = $('<DIV></DIV>');
      div
        .css({ position: 'absolute',
                display: 'block',
                  color: cluster.consts.COLORS[i]
             })
        .text(i + 1)
        .attr('id', 'c' + i);
      clustersDIV.append(div);
      cluster.clusters.unshift({ count: 0, x: 0, y: 0, sumX: 0, sumY: 0, div: div });
    }
  },

  initPoints: function() {
    // Get container for all points
    var pointsDIV = $('#points');

    for (var i = cluster.consts.POINTS_COUNT - 1; i >= 0; i += -1) {
      // Assign a point to each cluster to divide them evenly.
      var clusterID = i % cluster.consts.CLUSTER_COUNT;
      var div = $('<DIV></DIV>');
      var point = {
          x: Math.round(Math.random() * 600) + 2,
          y: Math.round(Math.random() * 600) + 2,
          cluster: clusterID,
          div: div
        };
      div
        .css({ position: 'absolute',
                   left: point.x,
                    top: point.y,
                  color: cluster.consts.COLORS[clusterID] })
        .text('o')
        .attr('id', 'p' + i);
      pointsDIV.append(div);
      cluster.points.push(point);

      var curCluster = cluster.clusters[clusterID];
      // Update the points average formula components for the cluster
      ++curCluster.count;
      curCluster.sumX += point.x;
      curCluster.sumY += point.y;
    }
  },

  start: function() {
    cluster.initClusters();
    cluster.initPoints();
    cluster.calcClusters();
    cluster.positionClusters();

    cluster.startTime = new Date().getTime();

    cluster.clusterStep();
    cluster.ivl = setInterval(cluster.clusterStep, cluster.consts.INTERVAL_STEP);
  },

  clusterStep: function() {
    // Reassign all points to clusters and report if any points moved.
    var moved = cluster.recluster();
    ++cluster.steps;
    var timeElapsed = ((new Date().getTime() - cluster.startTime) / 1000);

    // Comment the following two lines to skip updates during the process
    // and speed things up.
    cluster.positionClusters();

    // If we're done or hit one of our set limits, stop.
    if (moved == 0 ||
        cluster.steps == cluster.consts.MAX_STEPS ||
        timeElapsed >= cluster.consts.MAX_TIME_SEC) {
      clearInterval(cluster.ivl);

      // Update the results to screen.
      cluster.paintPoints();
      cluster.positionClusters();

      alert('Done in ' + timeElapsed + ' seconds.\nSteps: ' + cluster.steps);
    }
  },

  recluster: function() {
    var moved = 0;

    for (var i = cluster.consts.POINTS_COUNT - 1; i >= 0; i += -1) {
      var point = cluster.points[i];
      var curCluster = cluster.clusters[point.cluster];
      // If the cluster only has one point left - don't move the point.
      // Otherwise, we lose that cluster.
      if (curCluster.count <= 1) continue;

      var dX = point.x - curCluster.x;
      var dY = point.y - curCluster.y;

      // Store current distance from center of cluster.
      // We're not using Sqrt as it's not required for relative comparisons.
      var minDist = dX * dX + dY * dY;
      var curClusterID = point.cluster;
      var targetCluster = -1;

      for (var j = cluster.consts.CLUSTER_COUNT - 1; j >= 0; j += -1) {
        if (j == curClusterID) continue;

        var newCluster = cluster.clusters[j];

        dX = point.x - newCluster.x;
        dY = point.y - newCluster.y;
        // Get distance from center of the new cluster.
        // We're not using Sqrt as it's not required for relative comparisons.
        newDist = dX * dX + dY * dY;
        if (newDist < minDist) {
          minDist = newDist;
          targetCluster = j;
        }
      }

      if (targetCluster != -1) {
        // Update the points average formula components for the old cluster
        curCluster.count += -1;
        curCluster.sumX += -point.x;
        curCluster.sumY += -point.y;

        point.cluster = targetCluster;
        point.div.css('color', cluster.consts.COLORS[targetCluster]);

        // Update our pointer to the new cluster
        curCluster = cluster.clusters[point.cluster];
        // Update the points average formula components for the new cluster
        ++curCluster.count;
        curCluster.sumX += point.x;
        curCluster.sumY += point.y;

        ++moved;
      }
    }

    if (moved != 0) cluster.calcClusters();

    return moved;
  },

  calcClusters: function() {
    for (var i = cluster.consts.CLUSTER_COUNT - 1; i >= 0; i += -1) {
      var curCluster = cluster.clusters[i];
      var count = curCluster.count;
      curCluster.x = curCluster.sumX / count;
      curCluster.y = curCluster.sumY / count;
    }
  },

  paintPoints: function() {
    for (var i = cluster.consts.POINTS_COUNT - 1; i >= 0; i += -1) {
      var point = cluster.points[i];
      point.div.css('color', cluster.consts.COLORS[point.cluster]);
    }
  },

  positionClusters: function() {
    for (var i = cluster.consts.CLUSTER_COUNT - 1; i >= 0; i += -1) {
      var curCluster = cluster.clusters[i];
      curCluster.div
        .css({ left: Math.round(curCluster.x), top: Math.round(curCluster.y) })
        .text(curCluster.count);
    }
  }
};

$(document).ready(function () {
    cluster.start();
  });
