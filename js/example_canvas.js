function startClustering() {
	$('#startButton').hide();

	var POINT_RADIUS = 1;
	var FULL_CIRCLE = Math.PI * 2;
	var clustersDIV = $('#clusters');
	var pointsCanvas = $('<canvas></canvas>');
	var pointsDIV = $('#points');
	pointsDIV.append(pointsCanvas);
	pointsCanvas
		.css({ width: pointsDIV.width(), height: pointsDIV.height() })
		.attr({width: pointsDIV.width(), height: pointsDIV.height() });
	console.log(pointsCanvas);
	var pointsContext = pointsCanvas[0].getContext("2d");
	var colors = ['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#33AA88', '#FF8800', '#0088FF', '#003333', '#AA00AA', '#8800FF'];

  cluster.start({
		newClusterLabel: function (clusterID) {
			var div = $('<DIV></DIV>');
			div
        .css({ position: 'absolute',
                display: 'block',
                  color: colors[clusterID]
             })
        .text(clusterID + 1)
        .attr('id', 'c' + clusterID);

      clustersDIV.append(div);

			return {
				div: div,
				set: function(point, title) {
					this.div
						.css({ left: Math.round(point.x), top: Math.round(point.y) })
						.text(title);
				}
			};
		},

		newItem: function (point, clusterID) {
			return {
				point: point,
				setCluster: function(clusterID) {
					pointsContext.beginPath();
					pointsContext.arc(this.point.x + .5, this.point.y + .5, POINT_RADIUS, 0, FULL_CIRCLE);
					pointsContext.fillStyle = colors[clusterID];
					pointsContext.fill();
				}
			};
		},

		willUpdateItems: function () {
			console.log('Clearing')
			pointsContext.clearRect(0, 0, pointsCanvas.width, pointsCanvas.height);
		},

		updatedItems: function () {
		},

		onComplete: function (timeElapsed, steps) {
			setTimeout(function () { alert('Done in ' + timeElapsed + ' seconds.\nSteps: ' + steps); }, 100);
		}
	});
}
