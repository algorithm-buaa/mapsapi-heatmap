/**
 * Модуль для генерации тайлов тепловой карты.
 * @module visualization.heatmap.component.TileUrlsGenerator
 * @requires option.Manager
 * @requires visualization.heatmap.component.Canvas
 */
ymaps.modules.define('visualization.heatmap.component.TileUrlsGenerator', [
    'option.Manager',
    'visualization.heatmap.component.Canvas'
], function (
    provide,
    OptionManager,
    HeatmapCanvas
) {
    /**
     * Размер тайла карты.
     */
    var TILE_SIZE = [256, 256];

    /**
     * @public
     * @function TileUrlsGenerator
     * @description Конструктор генератора url тайлов тепловой карты.
     *
     * @param {Layer} layer Слой тепловой карты.
     * @param {Array} points Массив точек в географических координатах.
     */
    var TileUrlsGenerator = function (layer, points) {
        this._canvas = new HeatmapCanvas(TILE_SIZE);

        this.options = new OptionManager({});
        this._canvas.options.setParent(this.options);

        this._layer = layer;
        this._projection = this._layer.options.get('projection');

        this._points = [];
        if (points) {
            this.setPoints(points);
        }
    };

    /**
     * @public
     * @function setPoints
     * @description Устанавливает точки, которые будут нанесены на карту.
     *
     * @param {Array} points Массив точек [[x1, y1], [x2, y2], ...].
     * @returns {TileUrlsGenerator}
     */
    TileUrlsGenerator.prototype.setPoints = function (points) {
        this._points = [];

        var maxWeight = 1;
        for (var i = 0, length = points.length; i < length; i++) {
            this._points.push({
                coordinates: this._projection.toGlobalPixels(points[i].coordinates, 0),
                weight: points[i].weight
            });
            maxWeight = Math.max(maxWeight, points[i].weight);
        }
        this._canvas.options.set('maxWeight', maxWeight);

        return this;
    };

    /**
     * @public
     * @function getPoints
     * @description Отдает точки в географических координатах.
     *
     * @returns {Array} points Массив точек [[x1, y1], [x2, y2], ...].
     */
    TileUrlsGenerator.prototype.getPoints = function () {
        var points = [];
        for (var i = 0, length = this._points.length; i < length; i++) {
            this._points.push({
                coordinates: this._projection.fromGlobalPixels(this._points[i].coordinates, 0),
                weight: this._points[i].weight
            });
        }
        return points;
    };

    /**
     * @public
     * @function getTileUrl
     * @description Возвращает URL тайла по его номеру и уровню масштабирования.
     *
     * @param {Number[]} tileNumber Номер тайла [x, y].
     * @param {Number} zoom Зум тайла.
     * @returns {String} dataUrl.
     */
    TileUrlsGenerator.prototype.getTileUrl = function (tileNumber, zoom) {
        var tileBounds = [[
                tileNumber[0] * TILE_SIZE[0],
                tileNumber[1] * TILE_SIZE[1]
            ], [
                (tileNumber[0] + 1) * TILE_SIZE[0],
                (tileNumber[1] + 1) * TILE_SIZE[1]
            ]],
            tileMargin = this._canvas.getBrushRadius(),

            zoomFactor = Math.pow(2, zoom),
            points = [];

        for (var i = 0, length = this._points.length, point; i < length; i++) {
            point = [
                zoomFactor * this._points[i].coordinates[0],
                zoomFactor * this._points[i].coordinates[1]
            ];
            if (this._isPointInBounds(point, tileBounds, tileMargin)) {
                points.push({
                    coordinates: [
                        point[0] - tileBounds[0][0],
                        point[1] - tileBounds[0][1]
                    ],
                    weight: this._points[i].weight
                });
            }
        }

        return this._canvas.generateDataURLHeatmap(points);
    };

    /**
     * @public
     * @function destroy
     * @description Уничтожает внутренние данные генератора.
     */
    TileUrlsGenerator.prototype.destroy = function () {
        this._canvas.destroy();
        this._canvas = null;

        this._projection = null;
        this._layer = null;
    };

    /**
     * @private
     * @function _isPointInBounds
     * @description Проверка попадаения точки в границы карты.
     *
     * @param {Number[]} point Точка в географических координатах.
     * @param {Array} bounds Область, в которую попадание проверяется.
     * @param {Number} margin Необязательный параметр, если нужно расширисть bounds.
     * @returns {Boolean} True - попадает.
     */
    TileUrlsGenerator.prototype._isPointInBounds = function (point, bounds, margin) {
        return (point[0] >= bounds[0][0] - margin) &&
            (point[0] <= bounds[1][0] + margin) &&
            (point[1] >= bounds[0][1] - margin) &&
            (point[1] <= bounds[1][1] + margin);
    };

    provide(TileUrlsGenerator);
});
