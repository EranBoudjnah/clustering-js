var cluster = {
  consts: {
     POINTS_COUNT: 20000,
    CLUSTER_COUNT: 10,
        MAX_STEPS: 500,
     MAX_TIME_SEC: 2090.0,
    INTERVAL_STEP: 1
  },
  points: [],
  clusters: [],
  interval: 0,
  startTime: 0,
  steps: 0,
	renderer: {},

	start: function(renderer, params) {
		this.setDefaults(params);

		this.renderer = renderer

    this.initClusters();
    this.initPoints();
    this.calcClusters();
    this.positionClusterLabels();

    this.startTime = new Date().getTime();

    this.clusterStep(this);
		var instance = this
    this.interval = setInterval(function () {
			instance.clusterStep(instance)
		}, this.intervalStep);
  },

	setDefaults: function(params) {
		var fields = ['pointsCount', 'clusterCount', 'maxSteps', 'maxTimeSec', 'intervalStep']
		var defaults = {
				pointsCount: this.consts.POINTS_COUNT,
				clusterCount: this.consts.CLUSTER_COUNT,
				maxSteps: this.consts.MAX_STEPS,
				maxTimeSec: this.consts.MAX_TIME_SEC,
				intervalStep: this.consts.INTERVAL_STEP
			};
		fields.forEach(field => {
			if (params && params[field]) {
				this[field] = params[field]
			} else {
				this[field] = defaults[field]
			}
		});
	},

  initClusters: function() {
    for (var clusterID = this.clusterCount - 1; clusterID >= 0; clusterID += -1) {
			var label = this.renderer.newClusterLabel(clusterID);
      this.clusters.unshift({ count: 0, x: 0, y: 0, sumX: 0, sumY: 0, label: label });
    }
  },

  initPoints: function() {
    // Get container for all points

    for (var i = this.pointsCount - 1; i >= 0; i += -1) {
      // Assign a point to each cluster to divide them evenly.
      var clusterID = i % this.clusterCount;



			var point = {
			          x: Math.round(Math.random() * 600) + 2,
			          y: Math.round(Math.random() * 600) + 2,
			          cluster: clusterID
							};

      var item = this.renderer.newItem(point, clusterID);
			point.item = item
      this.points.push(point);

      var curCluster = this.clusters[clusterID];
      // Update the points average formula components for the cluster
      ++curCluster.count;
      curCluster.sumX += point.x;
      curCluster.sumY += point.y;
    }
  },

  clusterStep: function() {
    // Reassign all points to clusters and report if any points moved.
    var moved = this.recluster();
    ++this.steps;
    var timeElapsed = ((new Date().getTime() - this.startTime) / 1000);

		this.renderer.willUpdateItems();

    // Comment the following two lines to skip updates during the process
    // and speed things up.
    this.positionClusterLabels();

		this.renderer.updatedItems();

    // If we're done or hit one of our set limits, stop.
    if (moved == 0 ||
        this.steps == this.maxSteps ||
        timeElapsed >= this.maxTimeSec) {
					this.finalizeClustering(timeElapsed);
    }
  },

	finalizeClustering: function (timeElapsed) {
		clearInterval(this.interval);

		// Update the results to screen.
		var item = this
		setTimeout(function () {
			item.renderer.willUpdateItems();
			item.setClusterForItems();
			item.positionClusterLabels();

			item.renderer.onComplete(timeElapsed, item.steps);
		}, 1);
	},

  recluster: function() {
    var moved = 0;

    for (var i = this.pointsCount - 1; i >= 0; i += -1) {
      var point = this.points[i];
      var curCluster = this.clusters[point.cluster];
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

      for (var j = this.clusterCount - 1; j >= 0; j += -1) {
        if (j == curClusterID) continue;

        var newCluster = this.clusters[j];

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
				point.item.setCluster(targetCluster);

        // Update our pointer to the new cluster
        curCluster = this.clusters[point.cluster];
        // Update the points average formula components for the new cluster
        ++curCluster.count;
        curCluster.sumX += point.x;
        curCluster.sumY += point.y;

        ++moved;
      }
    }

    if (moved != 0) this.calcClusters();

    return moved;
  },

  calcClusters: function() {
    for (var i = this.clusterCount - 1; i >= 0; i += -1) {
      var curCluster = this.clusters[i];
      var count = curCluster.count;
      curCluster.x = curCluster.sumX / count;
      curCluster.y = curCluster.sumY / count;
    }
  },

  setClusterForItems: function() {
    for (var i = this.pointsCount - 1; i >= 0; i += -1) {
      var point = this.points[i];
			point.item.setCluster(point.cluster);
    }
  },

  positionClusterLabels: function() {
    for (var i = this.clusterCount - 1; i >= 0; i += -1) {
      var curCluster = this.clusters[i];
      curCluster.label.set(curCluster, curCluster.count)
    }
  }
};
