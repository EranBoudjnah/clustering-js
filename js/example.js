$(document).ready(function () {
	var clustersDIV = $('#clusters');
	var pointsDIV = $('#points');
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
			var div = $('<DIV></DIV>');
      div
        .css({ position: 'absolute',
                   left: point.x,
                    top: point.y,
                  color: colors[clusterID] })
        .text('o')
        .attr('id', 'p' + clusterID);

      pointsDIV.append(div);

			return {
				div: div,
				setCluster: function(clusterID) {
					this.div.css('color', colors[clusterID]);
				}
			};
		}
	});
});
