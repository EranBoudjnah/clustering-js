function startClustering() {
	$('#startButton').hide();

	var canvas;
	var colors = [
		"#FF0000", "#00FF00", "#0000FF", "#FF00FF",
		"#33AA88", "#FF8800", "#0088FF", "#003333",
		"#AA00AA", "#8800FF"
	];

	var drawPoint = function(x, y, color) {
		context.clearRect(x - 1, y - 1, 2, 2);
		context.beginPath();
		context.rect(x - 1, y - 1, 2, 2);
		context.fillStyle = color;
		context.fill();
		context.closePath();
	};

	var canvasTag = $("<canvas><\/canvas>");
	canvasTag.attr("id", "clusteringCanvas");
	var clustersDiv = $("#clusters");
	clustersDiv.append(canvasTag);
	canvas = canvasTag[0];
	var context = canvas.getContext('2d');
	context.canvas.height = clustersDiv.height();
	context.canvas.width = clustersDiv.width();

	cluster.start({
		colors: colors,
		itemsCount: 20000,
		interval: 1,
		newItemEntityFunction: function (initialClusterId, itemId, item, cache) {
			drawPoint(item.x, item.y, colors[initialClusterId % colors.length]);
		},
		updateItemEntityFunction: function (item) {
			drawPoint(item.x, item.y, colors[item.clusterId % colors.length]);
		},
		randomFunction: (function() {
			return Math.round(Math.random() * 600) + 2
		}),
		beforeStepFunction: function (step, isLastStep) {
		if (isLastStep) {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
		}
	});
}
