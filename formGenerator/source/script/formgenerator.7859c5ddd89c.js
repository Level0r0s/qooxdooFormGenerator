/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The grid layout manager arranges the items in a two dimensional
 * grid. Widgets can be placed into the grid's cells and may span multiple rows
 * and columns.
 *
 * *Features*
 *
 * * Flex values for rows and columns
 * * Minimal and maximal column and row sizes
 * * Manually setting of column and row sizes
 * * Horizontal and vertical alignment
 * * Horizontal and vertical spacing
 * * Column and row spans
 * * Auto-sizing
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>row</strong> <em>(Integer)</em>: The row of the cell the
 *   widget should occupy. Each cell can only contain one widget. This layout
 *   property is mandatory.
 * </li>
 * <li><strong>column</strong> <em>(Integer)</em>: The column of the cell the
 *   widget should occupy. Each cell can only contain one widget. This layout
 *   property is mandatory.
 * </li>
 * <li><strong>rowSpan</strong> <em>(Integer)</em>: The number of rows, the
 *   widget should span, starting from the row specified in the <code>row</code>
 *   property. The cells in the spanned rows must be empty as well.
 * </li>
 * <li><strong>colSpan</strong> <em>(Integer)</em>: The number of columns, the
 *   widget should span, starting from the column specified in the <code>column</code>
 *   property. The cells in the spanned columns must be empty as well.
 * </li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the grid layout.
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.Grid();
 * layout.setRowFlex(0, 1); // make row 0 flexible
 * layout.setColumnWidth(1, 200); // set with of column 1 to 200 pixel
 *
 * var container = new qx.ui.container.Composite(layout);
 * container.add(new qx.ui.core.Widget(), {row: 0, column: 0});
 * container.add(new qx.ui.core.Widget(), {row: 0, column: 1});
 * container.add(new qx.ui.core.Widget(), {row: 1, column: 0, rowSpan: 2});
 * </pre>
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/grid.html'>
 * Extended documentation</a> and links to demos of this layout in the qooxdoo manual.
 */
qx.Class.define("qx.ui.layout.Grid",
{
  extend : qx.ui.layout.Abstract,






  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param spacingX {Integer?0} The horizontal spacing between grid cells.
   *     Sets {@link #spacingX}.
   * @param spacingY {Integer?0} The vertical spacing between grid cells.
   *     Sets {@link #spacingY}.
   */
  construct : function(spacingX, spacingY)
  {
    this.base(arguments);

    this.__rowData = [];
    this.__colData = [];

    if (spacingX) {
      this.setSpacingX(spacingX);
    }

    if (spacingY) {
      this.setSpacingY(spacingY);
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * The horizontal spacing between grid cells.
     */
    spacingX :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    },


    /**
     * The vertical spacing between grid cells.
     */
    spacingY :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** {Array} 2D array of grid cell data */
    __grid : null,
    __rowData : null,
    __colData : null,

    __colSpans : null,
    __rowSpans : null,
    __maxRowIndex : null,
    __maxColIndex : null,

    /** {Array} cached row heights */
    __rowHeights : null,

    /** {Array} cached column widths */
    __colWidths : null,



    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        var layoutProperties = {
          "row" : 1,
          "column" : 1,
          "rowSpan" : 1,
          "colSpan" : 1
        }
        this.assert(layoutProperties[name] == 1, "The property '"+name+"' is not supported by the Grid layout!");
        this.assertInteger(value);
        this.assert(value >= 0, "Value must be positive");
      },

      "false" : null
    }),


    /**
     * Rebuild the internal representation of the grid
     */
    __buildGrid : function()
    {
      var grid = [];
      var colSpans = [];
      var rowSpans = [];

      var maxRowIndex = -1;
      var maxColIndex = -1;

      var children = this._getLayoutChildren();

      for (var i=0,l=children.length; i<l; i++)
      {
        var child = children[i];
        var props = child.getLayoutProperties();

        var row = props.row;
        var column = props.column;

        props.colSpan = props.colSpan || 1;
        props.rowSpan = props.rowSpan || 1;

        // validate arguments
        if (row == null || column == null) {
          throw new Error(
            "The layout properties 'row' and 'column' of the child widget '" +
            child + "' must be defined!"
          );
        }

        if (grid[row] && grid[row][column]) {
          throw new Error(
            "Cannot add widget '" + child + "'!. " +
            "There is already a widget '" + grid[row][column] +
            "' in this cell (" + row + ", " + column + ") for '" + this + "'"
          );
        }

        for (var x=column; x<column+props.colSpan; x++)
        {
          for (var y=row; y<row+props.rowSpan; y++)
          {
            if (grid[y] == undefined) {
               grid[y] = [];
            }

            grid[y][x] = child;

            maxColIndex = Math.max(maxColIndex, x);
            maxRowIndex = Math.max(maxRowIndex, y);
          }
        }

        if (props.rowSpan > 1) {
          rowSpans.push(child);
        }

        if (props.colSpan > 1) {
          colSpans.push(child);
        }
      }

      // make sure all columns are defined so that accessing the grid using
      // this.__grid[column][row] will never raise an exception
      for (var y=0; y<=maxRowIndex; y++) {
        if (grid[y] == undefined) {
           grid[y] = [];
        }
      }

      this.__grid = grid;

      this.__colSpans = colSpans;
      this.__rowSpans = rowSpans;

      this.__maxRowIndex = maxRowIndex;
      this.__maxColIndex = maxColIndex;

      this.__rowHeights = null;
      this.__colWidths = null;

      // Clear invalidation marker
      delete this._invalidChildrenCache;
    },


    /**
     * Stores data for a grid row
     *
     * @param row {Integer} The row index
     * @param key {String} The key under which the data should be stored
     * @param value {var} data to store
     */
    _setRowData : function(row, key, value)
    {
      var rowData = this.__rowData[row];

      if (!rowData)
      {
        this.__rowData[row] = {};
        this.__rowData[row][key] = value;
      }
      else
      {
        rowData[key] = value;
      }
    },


    /**
     * Stores data for a grid column
     *
     * @param column {Integer} The column index
     * @param key {String} The key under which the data should be stored
     * @param value {var} data to store
     */
    _setColumnData : function(column, key, value)
    {
      var colData = this.__colData[column];

      if (!colData)
      {
        this.__colData[column] = {};
        this.__colData[column][key] = value;
      }
      else
      {
        colData[key] = value;
      }
    },


    /**
     * Shortcut to set both horizontal and vertical spacing between grid cells
     * to the same value.
     *
     * @param spacing {Integer} new horizontal and vertical spacing
     * @return {qx.ui.layout.Grid} This object (for chaining support).
     */
    setSpacing : function(spacing)
    {
      this.setSpacingY(spacing);
      this.setSpacingX(spacing);
      return this;
    },


    /**
     * Set the default cell alignment for a column. This alignment can be
     * overridden on a per cell basis by setting the cell's content widget's
     * <code>alignX</code> and <code>alignY</code> properties.
     *
     * If on a grid cell both row and a column alignment is set, the horizontal
     * alignment is taken from the column and the vertical alignment is taken
     * from the row.
     *
     * @param column {Integer} Column index
     * @param hAlign {String} The horizontal alignment. Valid values are
     *    "left", "center" and "right".
     * @param vAlign {String} The vertical alignment. Valid values are
     *    "top", "middle", "bottom"
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnAlign : function(column, hAlign, vAlign)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertInteger(column, "Invalid parameter 'column'");
        this.assertInArray(hAlign, ["left", "center", "right"]);
        this.assertInArray(vAlign, ["top", "middle", "bottom"]);
      }

      this._setColumnData(column, "hAlign", hAlign);
      this._setColumnData(column, "vAlign", vAlign);

      this._applyLayoutChange();

      return this;
    },


    /**
     * Get a map of the column's alignment.
     *
     * @param column {Integer} The column index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal column alignment.
     */
    getColumnAlign : function(column)
    {
      var colData = this.__colData[column] || {};

      return {
        vAlign : colData.vAlign || "top",
        hAlign : colData.hAlign || "left"
      };
    },


    /**
     * Set the default cell alignment for a row. This alignment can be
     * overridden on a per cell basis by setting the cell's content widget's
     * <code>alignX</code> and <code>alignY</code> properties.
     *
     * If on a grid cell both row and a column alignment is set, the horizontal
     * alignment is taken from the column and the vertical alignment is taken
     * from the row.
     *
     * @param row {Integer} Row index
     * @param hAlign {String} The horizontal alignment. Valid values are
     *    "left", "center" and "right".
     * @param vAlign {String} The vertical alignment. Valid values are
     *    "top", "middle", "bottom"
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowAlign : function(row, hAlign, vAlign)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        this.assertInteger(row, "Invalid parameter 'row'");
        this.assertInArray(hAlign, ["left", "center", "right"]);
        this.assertInArray(vAlign, ["top", "middle", "bottom"]);
      }

      this._setRowData(row, "hAlign", hAlign);
      this._setRowData(row, "vAlign", vAlign);

      this._applyLayoutChange();

      return this;
    },


    /**
     * Get a map of the row's alignment.
     *
     * @param row {Integer} The Row index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal row alignment.
     */
    getRowAlign : function(row)
    {
      var rowData = this.__rowData[row] || {};

      return {
        vAlign : rowData.vAlign || "top",
        hAlign : rowData.hAlign || "left"
      };
    },


    /**
     * Get the widget located in the cell. If a the cell is empty or the widget
     * has a {@link qx.ui.core.Widget#visibility} value of <code>exclude</code>,
     * <code>null</code> is returned.
     *
     * @param row {Integer} The cell's row index
     * @param column {Integer} The cell's column index
     * @return {qx.ui.core.Widget|null}The cell's widget. The value may be null.
     */
    getCellWidget : function(row, column)
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      var row = this.__grid[row] || {};
      return row[column] ||  null;
    },


    /**
     * Get the number of rows in the grid layout.
     *
     * @return {Integer} The number of rows in the layout
     */
    getRowCount : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      return this.__maxRowIndex + 1;
    },


    /**
     * Get the number of columns in the grid layout.
     *
     * @return {Integer} The number of columns in the layout
     */
    getColumnCount : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      return this.__maxColIndex + 1;
    },


    /**
     * Get a map of the cell's alignment. For vertical alignment the row alignment
     * takes precedence over the column alignment. For horizontal alignment it is
     * the over way round. If an alignment is set on the cell widget using
     * {@link qx.ui.core.LayoutItem#setLayoutProperties}, this alignment takes
     * always precedence over row or column alignment.
     *
     * @param row {Integer} The cell's row index
     * @param column {Integer} The cell's column index
     * @return {Map} A map with the keys <code>vAlign</code> and <code>hAlign</code>
     *     containing the vertical and horizontal cell alignment.
     */
    getCellAlign : function(row, column)
    {
      var vAlign = "top";
      var hAlign = "left";

      var rowData = this.__rowData[row];
      var colData = this.__colData[column];

      var widget = this.__grid[row][column];
      if (widget)
      {
        var widgetProps = {
          vAlign : widget.getAlignY(),
          hAlign : widget.getAlignX()
        }
      }
      else
      {
        widgetProps = {};
      }

      // compute vAlign
      // precedence : widget -> row -> column
      if (widgetProps.vAlign) {
        vAlign = widgetProps.vAlign;
      } else if (rowData && rowData.vAlign) {
        vAlign = rowData.vAlign;
      } else if (colData && colData.vAlign) {
        vAlign = colData.vAlign;
      }

      // compute hAlign
      // precedence : widget -> column -> row
      if (widgetProps.hAlign) {
        hAlign = widgetProps.hAlign;
      } else if (colData && colData.hAlign) {
        hAlign = colData.hAlign;
      } else if (rowData && rowData.hAlign) {
        hAlign = rowData.hAlign;
      }

      return {
        vAlign : vAlign,
        hAlign : hAlign
      }
    },


    /**
     * Set the flex value for a grid column.
     * By default the column flex value is <code>0</code>.
     *
     * @param column {Integer} The column index
     * @param flex {Integer} The column's flex value
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnFlex : function(column, flex)
    {
      this._setColumnData(column, "flex", flex);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the flex value of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's flex value
     */
    getColumnFlex : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.flex !== undefined ? colData.flex : 0;
    },


    /**
     * Set the flex value for a grid row.
     * By default the row flex value is <code>0</code>.
     *
     * @param row {Integer} The row index
     * @param flex {Integer} The row's flex value
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowFlex : function(row, flex)
    {
      this._setRowData(row, "flex", flex);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the flex value of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's flex value
     */
    getRowFlex : function(row)
    {
      var rowData = this.__rowData[row] || {};
      var rowFlex = rowData.flex !== undefined ? rowData.flex : 0
      return rowFlex;
    },


    /**
     * Set the maximum width of a grid column.
     * The default value is <code>Infinity</code>.
     *
     * @param column {Integer} The column index
     * @param maxWidth {Integer} The column's maximum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnMaxWidth : function(column, maxWidth)
    {
      this._setColumnData(column, "maxWidth", maxWidth);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the maximum width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's maximum width
     */
    getColumnMaxWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.maxWidth !== undefined ? colData.maxWidth : Infinity;
    },


    /**
     * Set the preferred width of a grid column.
     * The default value is <code>Infinity</code>.
     *
     * @param column {Integer} The column index
     * @param width {Integer} The column's width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnWidth : function(column, width)
    {
      this._setColumnData(column, "width", width);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the preferred width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's width
     */
    getColumnWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.width !== undefined ? colData.width : null;
    },


    /**
     * Set the minimum width of a grid column.
     * The default value is <code>0</code>.
     *
     * @param column {Integer} The column index
     * @param minWidth {Integer} The column's minimum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setColumnMinWidth : function(column, minWidth)
    {
      this._setColumnData(column, "minWidth", minWidth);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the minimum width of a grid column.
     *
     * @param column {Integer} The column index
     * @return {Integer} The column's minimum width
     */
    getColumnMinWidth : function(column)
    {
      var colData = this.__colData[column] || {};
      return colData.minWidth || 0;
    },


    /**
     * Set the maximum height of a grid row.
     * The default value is <code>Infinity</code>.
     *
     * @param row {Integer} The row index
     * @param maxHeight {Integer} The row's maximum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowMaxHeight : function(row, maxHeight)
    {
      this._setRowData(row, "maxHeight", maxHeight);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the maximum height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's maximum width
     */
    getRowMaxHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.maxHeight || Infinity;
    },


    /**
     * Set the preferred height of a grid row.
     * The default value is <code>Infinity</code>.
     *
     * @param row {Integer} The row index
     * @param height {Integer} The row's width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowHeight : function(row, height)
    {
      this._setRowData(row, "height", height);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the preferred height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's width
     */
    getRowHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.height !== undefined ? rowData.height : null;
    },


    /**
     * Set the minimum height of a grid row.
     * The default value is <code>0</code>.
     *
     * @param row {Integer} The row index
     * @param minHeight {Integer} The row's minimum width
     * @return {qx.ui.layout.Grid} This object (for chaining support)
     */
    setRowMinHeight : function(row, minHeight)
    {
      this._setRowData(row, "minHeight", minHeight);
      this._applyLayoutChange();
      return this;
    },


    /**
     * Get the minimum height of a grid row.
     *
     * @param row {Integer} The row index
     * @return {Integer} The row's minimum width
     */
    getRowMinHeight : function(row)
    {
      var rowData = this.__rowData[row] || {};
      return rowData.minHeight || 0;
    },


    /**
     * Computes the widget's size hint including the widget's margins
     *
     * @param widget {qx.ui.core.LayoutItem} The widget to get the size for
     * @return {Map} a size hint map
     */
    __getOuterSize : function(widget)
    {
      var hint = widget.getSizeHint();
      var hMargins = widget.getMarginLeft() + widget.getMarginRight();
      var vMargins = widget.getMarginTop() + widget.getMarginBottom();

      var outerSize = {
        height: hint.height + vMargins,
        width: hint.width + hMargins,
        minHeight: hint.minHeight + vMargins,
        minWidth: hint.minWidth + hMargins,
        maxHeight: hint.maxHeight + vMargins,
        maxWidth: hint.maxWidth + hMargins
      }

      return outerSize;
    },


    /**
     * Check whether all row spans fit with their preferred height into the
     * preferred row heights. If there is not enough space, the preferred
     * row sizes are increased. The distribution respects the flex and max
     * values of the rows.
     *
     *  The same is true for the min sizes.
     *
     *  The height array is modified in place.
     *
     * @param rowHeights {Map[]} The current row height array as computed by
     *     {@link #_getRowHeights}.
     */
    _fixHeightsRowSpan : function(rowHeights)
    {
      var vSpacing = this.getSpacingY();

      for (var i=0, l=this.__rowSpans.length; i<l; i++)
      {
        var widget = this.__rowSpans[i];

        var hint = this.__getOuterSize(widget);

        var widgetProps = widget.getLayoutProperties();
        var widgetRow = widgetProps.row;

        var prefSpanHeight = vSpacing * (widgetProps.rowSpan - 1);
        var minSpanHeight = prefSpanHeight;

        var rowFlexes = {};

        for (var j=0; j<widgetProps.rowSpan; j++)
        {
          var row = widgetProps.row+j;
          var rowHeight = rowHeights[row];
          var rowFlex = this.getRowFlex(row);

          if (rowFlex > 0)
          {
            // compute flex array for the preferred height
            rowFlexes[row] =
            {
              min : rowHeight.minHeight,
              value : rowHeight.height,
              max : rowHeight.maxHeight,
              flex: rowFlex
            };
          }

          prefSpanHeight += rowHeight.height;
          minSpanHeight += rowHeight.minHeight;
        }

        // If there is not enough space for the preferred size
        // increment the preferred row sizes.
        if (prefSpanHeight < hint.height)
        {
          if (!qx.lang.Object.isEmpty(rowFlexes)) {
            var rowIncrements = qx.ui.layout.Util.computeFlexOffsets(
              rowFlexes, hint.height, prefSpanHeight
            );

            for (var k=0; k<widgetProps.rowSpan; k++)
            {
              var offset = rowIncrements[widgetRow+k] ? rowIncrements[widgetRow+k].offset : 0;
              rowHeights[widgetRow+k].height += offset;
            }
          // row is too small and we have no flex value set
          } else {
            var totalSpacing = vSpacing * (widgetProps.rowSpan - 1);
            var availableHeight = hint.height - totalSpacing;

            // get the row height which every child would need to share the
            // available hight equally
            var avgRowHeight =
              Math.floor(availableHeight / widgetProps.rowSpan);

            // get the hight already used and the number of children which do
            // not have at least that avg row height
            var usedHeight = 0;
            var rowsNeedAddition = 0;
            for (var k = 0; k < widgetProps.rowSpan; k++) {
              var currentHeight = rowHeights[widgetRow + k].height;
              usedHeight += currentHeight;
              if (currentHeight < avgRowHeight) {
                rowsNeedAddition++;
              }
            }

            // the difference of available and used needs to be shared among
            // those not having the min size
            var additionalRowHeight =
              Math.floor((availableHeight - usedHeight) / rowsNeedAddition);

            // add the extra height to the too small children
            for (var k = 0; k < widgetProps.rowSpan; k++) {
              if (rowHeights[widgetRow + k].height < avgRowHeight) {
                rowHeights[widgetRow + k].height += additionalRowHeight;
              }
            }
          }
        }

        // If there is not enough space for the min size
        // increment the min row sizes.
        if (minSpanHeight < hint.minHeight)
        {
          var rowIncrements = qx.ui.layout.Util.computeFlexOffsets(
            rowFlexes, hint.minHeight, minSpanHeight
          );

          for (var j=0; j<widgetProps.rowSpan; j++)
          {
            var offset = rowIncrements[widgetRow+j] ? rowIncrements[widgetRow+j].offset : 0;
            rowHeights[widgetRow+j].minHeight += offset;
          }
        }
      }
    },


    /**
     * Check whether all col spans fit with their preferred width into the
     * preferred column widths. If there is not enough space the preferred
     * column sizes are increased. The distribution respects the flex and max
     * values of the columns.
     *
     *  The same is true for the min sizes.
     *
     *  The width array is modified in place.
     *
     * @param colWidths {Map[]} The current column width array as computed by
     *     {@link #_getColWidths}.
     */
    _fixWidthsColSpan : function(colWidths)
    {
      var hSpacing = this.getSpacingX();

      for (var i=0, l=this.__colSpans.length; i<l; i++)
      {
        var widget = this.__colSpans[i];

        var hint = this.__getOuterSize(widget);

        var widgetProps = widget.getLayoutProperties();
        var widgetColumn = widgetProps.column;

        var prefSpanWidth = hSpacing * (widgetProps.colSpan - 1);
        var minSpanWidth = prefSpanWidth;

        var colFlexes = {};

        var offset;

        for (var j=0; j<widgetProps.colSpan; j++)
        {
          var col = widgetProps.column+j;
          var colWidth = colWidths[col];
          var colFlex = this.getColumnFlex(col);

          // compute flex array for the preferred width
          if (colFlex > 0)
          {
            colFlexes[col] =
            {
              min : colWidth.minWidth,
              value : colWidth.width,
              max : colWidth.maxWidth,
              flex: colFlex
            };
          }

          prefSpanWidth += colWidth.width;
          minSpanWidth += colWidth.minWidth;
        }

        // If there is not enought space for the preferred size
        // increment the preferred column sizes.
        if (prefSpanWidth < hint.width)
        {
          var colIncrements = qx.ui.layout.Util.computeFlexOffsets(
            colFlexes, hint.width, prefSpanWidth
          );

          for (var j=0; j<widgetProps.colSpan; j++)
          {
            offset = colIncrements[widgetColumn+j] ? colIncrements[widgetColumn+j].offset : 0;
            colWidths[widgetColumn+j].width += offset;
          }
        }

        // If there is not enought space for the min size
        // increment the min column sizes.
        if (minSpanWidth < hint.minWidth)
        {
          var colIncrements = qx.ui.layout.Util.computeFlexOffsets(
            colFlexes, hint.minWidth, minSpanWidth
          );

          for (var j=0; j<widgetProps.colSpan; j++)
          {
            offset = colIncrements[widgetColumn+j] ? colIncrements[widgetColumn+j].offset : 0;
            colWidths[widgetColumn+j].minWidth += offset;
          }
        }
      }
    },


    /**
     * Compute the min/pref/max row heights.
     *
     * @return {Map[]} An array containg height information for each row. The
     *     entries have the keys <code>minHeight</code>, <code>maxHeight</code> and
     *     <code>height</code>.
     */
    _getRowHeights : function()
    {
      if (this.__rowHeights != null) {
        return this.__rowHeights;
      }

      var rowHeights = [];

      var maxRowIndex = this.__maxRowIndex;
      var maxColIndex = this.__maxColIndex;

      for (var row=0; row<=maxRowIndex; row++)
      {
        var minHeight = 0;
        var height = 0;
        var maxHeight = 0;

        for (var col=0; col<=maxColIndex; col++)
        {
          var widget = this.__grid[row][col];
          if (!widget) {
            continue;
          }

          // ignore rows with row spans at this place
          // these rows will be taken into account later
          var widgetRowSpan = widget.getLayoutProperties().rowSpan || 0;
          if (widgetRowSpan > 1) {
            continue;
          }

          var cellSize = this.__getOuterSize(widget);

          if (this.getRowFlex(row) > 0) {
            minHeight = Math.max(minHeight, cellSize.minHeight);
          } else {
            minHeight = Math.max(minHeight, cellSize.height);
          }

          height = Math.max(height, cellSize.height);
        }

        var minHeight = Math.max(minHeight, this.getRowMinHeight(row));
        var maxHeight = this.getRowMaxHeight(row);

        if (this.getRowHeight(row) !== null) {
          var height = this.getRowHeight(row);
        } else {
          var height = Math.max(minHeight, Math.min(height, maxHeight));
        }

        rowHeights[row] = {
          minHeight : minHeight,
          height : height,
          maxHeight : maxHeight
        };
      }

      if (this.__rowSpans.length > 0) {
        this._fixHeightsRowSpan(rowHeights);
      }

      this.__rowHeights = rowHeights;
      return rowHeights;
    },


    /**
     * Compute the min/pref/max column widths.
     *
     * @return {Map[]} An array containg width information for each column. The
     *     entries have the keys <code>minWidth</code>, <code>maxWidth</code> and
     *     <code>width</code>.
     */
    _getColWidths : function()
    {
      if (this.__colWidths != null) {
        return this.__colWidths;
      }

      var colWidths = [];

      var maxColIndex = this.__maxColIndex;
      var maxRowIndex = this.__maxRowIndex;

      for (var col=0; col<=maxColIndex; col++)
      {
        var width = 0;
        var minWidth = 0;
        var maxWidth = Infinity;

        for (var row=0; row<=maxRowIndex; row++)
        {
          var widget = this.__grid[row][col];
          if (!widget) {
            continue;
          }

          // ignore columns with col spans at this place
          // these columns will be taken into account later
          var widgetColSpan = widget.getLayoutProperties().colSpan || 0;
          if (widgetColSpan > 1) {
            continue;
          }

          var cellSize = this.__getOuterSize(widget);

          if (this.getColumnFlex(col) > 0) {
            minWidth = Math.max(minWidth, cellSize.minWidth);
          } else {
            minWidth = Math.max(minWidth, cellSize.width);
          }

          width = Math.max(width, cellSize.width);
        }

        minWidth = Math.max(minWidth, this.getColumnMinWidth(col));
        maxWidth = this.getColumnMaxWidth(col);

        if (this.getColumnWidth(col) !== null) {
          var width = this.getColumnWidth(col);
        } else {
          var width = Math.max(minWidth, Math.min(width, maxWidth));
        }

        colWidths[col] = {
          minWidth: minWidth,
          width : width,
          maxWidth : maxWidth
        };
      }

      if (this.__colSpans.length > 0) {
        this._fixWidthsColSpan(colWidths);
      }

      this.__colWidths = colWidths;
      return colWidths;
    },


    /**
     * Computes for each column by how many pixels it must grow or shrink, taking
     * the column flex values and min/max widths into account.
     *
     * @param width {Integer} The grid width
     * @return {Integer[]} Sparse array of offsets to add to each column width. If
     *     an array entry is empty nothing should be added to the column.
     */
    _getColumnFlexOffsets : function(width)
    {
      var hint = this.getSizeHint();
      var diff = width - hint.width;

      if (diff == 0) {
        return {};
      }

      // collect all flexible children
      var colWidths = this._getColWidths();
      var flexibles = {};

      for (var i=0, l=colWidths.length; i<l; i++)
      {
        var col = colWidths[i];
        var colFlex = this.getColumnFlex(i);

        if (
          (colFlex <= 0) ||
          (col.width == col.maxWidth && diff > 0) ||
          (col.width == col.minWidth && diff < 0)
        ) {
          continue;
        }

        flexibles[i] ={
          min : col.minWidth,
          value : col.width,
          max : col.maxWidth,
          flex : colFlex
        };
      }

      return qx.ui.layout.Util.computeFlexOffsets(flexibles, width, hint.width);
    },


    /**
     * Computes for each row by how many pixels it must grow or shrink, taking
     * the row flex values and min/max heights into account.
     *
     * @param height {Integer} The grid height
     * @return {Integer[]} Sparse array of offsets to add to each row height. If
     *     an array entry is empty nothing should be added to the row.
     */
    _getRowFlexOffsets : function(height)
    {
      var hint = this.getSizeHint();
      var diff = height - hint.height;

      if (diff == 0) {
        return {};
      }

      // collect all flexible children
      var rowHeights = this._getRowHeights();
      var flexibles = {};

      for (var i=0, l=rowHeights.length; i<l; i++)
      {
        var row = rowHeights[i];
        var rowFlex = this.getRowFlex(i);

        if (
          (rowFlex <= 0) ||
          (row.height == row.maxHeight && diff > 0) ||
          (row.height == row.minHeight && diff < 0)
        ) {
          continue;
        }

        flexibles[i] = {
          min : row.minHeight,
          value : row.height,
          max : row.maxHeight,
          flex : rowFlex
        };
      }

      return qx.ui.layout.Util.computeFlexOffsets(flexibles, height, hint.height);
    },


    // overridden
    renderLayout : function(availWidth, availHeight)
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      var Util = qx.ui.layout.Util;
      var hSpacing = this.getSpacingX();
      var vSpacing = this.getSpacingY();

      // calculate column widths
      var prefWidths = this._getColWidths();
      var colStretchOffsets = this._getColumnFlexOffsets(availWidth);

      var colWidths = [];

      var maxColIndex = this.__maxColIndex;
      var maxRowIndex = this.__maxRowIndex;

      var offset;

      for (var col=0; col<=maxColIndex; col++)
      {
        offset = colStretchOffsets[col] ? colStretchOffsets[col].offset : 0;
        colWidths[col] = prefWidths[col].width + offset;
      }

      // calculate row heights
      var prefHeights = this._getRowHeights();
      var rowStretchOffsets = this._getRowFlexOffsets(availHeight);

      var rowHeights = [];

      for (var row=0; row<=maxRowIndex; row++)
      {
        offset = rowStretchOffsets[row] ? rowStretchOffsets[row].offset : 0;
        rowHeights[row] = prefHeights[row].height + offset;
      }

      // do the layout
      var left = 0;
      for (var col=0; col<=maxColIndex; col++)
      {
        var top = 0;

        for (var row=0; row<=maxRowIndex; row++)
        {
          var widget = this.__grid[row][col];

          // ignore empty cells
          if (!widget)
          {
            top += rowHeights[row] + vSpacing;
            continue;
          }

          var widgetProps = widget.getLayoutProperties();

          // ignore cells, which have cell spanning but are not the origin
          // of the widget
          if(widgetProps.row !== row || widgetProps.column !== col)
          {
            top += rowHeights[row] + vSpacing;
            continue;
          }

          // compute sizes width including cell spanning
          var spanWidth = hSpacing * (widgetProps.colSpan - 1);
          for (var i=0; i<widgetProps.colSpan; i++) {
            spanWidth += colWidths[col+i];
          }

          var spanHeight = vSpacing * (widgetProps.rowSpan - 1);
          for (var i=0; i<widgetProps.rowSpan; i++) {
            spanHeight += rowHeights[row+i];
          }

          var cellHint = widget.getSizeHint();
          var marginTop = widget.getMarginTop();
          var marginLeft = widget.getMarginLeft();
          var marginBottom = widget.getMarginBottom();
          var marginRight = widget.getMarginRight();

          var cellWidth = Math.max(cellHint.minWidth, Math.min(spanWidth-marginLeft-marginRight, cellHint.maxWidth));
          var cellHeight = Math.max(cellHint.minHeight, Math.min(spanHeight-marginTop-marginBottom, cellHint.maxHeight));

          var cellAlign = this.getCellAlign(row, col);
          var cellLeft = left + Util.computeHorizontalAlignOffset(cellAlign.hAlign, cellWidth, spanWidth, marginLeft, marginRight);
          var cellTop = top + Util.computeVerticalAlignOffset(cellAlign.vAlign, cellHeight, spanHeight, marginTop, marginBottom);

          widget.renderLayout(
            cellLeft,
            cellTop,
            cellWidth,
            cellHeight
          );

          top += rowHeights[row] + vSpacing;
        }

        left += colWidths[col] + hSpacing;
      }
    },


    // overridden
    invalidateLayoutCache : function()
    {
      this.base(arguments);

      this.__colWidths = null;
      this.__rowHeights = null;
    },


    // overridden
    _computeSizeHint : function()
    {
      if (this._invalidChildrenCache) {
        this.__buildGrid();
      }

      // calculate col widths
      var colWidths = this._getColWidths();

      var minWidth=0, width=0;

      for (var i=0, l=colWidths.length; i<l; i++)
      {
        var col = colWidths[i];
        if (this.getColumnFlex(i) > 0) {
          minWidth += col.minWidth;
        } else {
          minWidth += col.width;
        }

        width += col.width;
      }

      // calculate row heights
      var rowHeights = this._getRowHeights();

      var minHeight=0, height=0;
      for (var i=0, l=rowHeights.length; i<l; i++)
      {
        var row = rowHeights[i];

        if (this.getRowFlex(i) > 0) {
          minHeight += row.minHeight;
        } else {
          minHeight += row.height;
        }

        height += row.height;
      }

      var spacingX = this.getSpacingX() * (colWidths.length - 1);
      var spacingY = this.getSpacingY() * (rowHeights.length - 1);

      var hint = {
        minWidth : minWidth + spacingX,
        width : width + spacingX,
        minHeight : minHeight + spacingY,
        height : height + spacingY
      };

      return hint;
    }
  },




  /*
  *****************************************************************************
     DESTRUCT
  *****************************************************************************
  */

  destruct : function()
  {
    this.__grid = this.__rowData = this.__colData = this.__colSpans =
      this.__rowSpans = this.__colWidths = this.__rowHeights = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Mixin responsible for setting the background color of a widget.
 * This mixin is usually used by {@link qx.ui.decoration.DynamicDecorator}.
 */
qx.Mixin.define("qx.ui.decoration.MBackgroundColor",
{
  properties :
  {
    /** Color of the background */
    backgroundColor :
    {
      check : "Color",
      nullable : true,
      apply : "_applyBackgroundColor"
    }
  },


  members :
  {
    /**
     * Tint function for the background color. This is suitable for the
     * {@link qx.ui.decoration.DynamicDecorator}.
     *
     * @param element {Element} The element which could be resized.
     * @param bgcolor {Color} The new background color.
     * @param styles {Map} A map of styles to apply.
     */
    _tintBackgroundColor : function(element, bgcolor, styles) {
      if (bgcolor == null) {
        bgcolor = this.getBackgroundColor();
      }

      if (qx.core.Environment.get("qx.theme"))
      {
        bgcolor = qx.theme.manager.Color.getInstance().resolve(bgcolor);
      }

      styles.backgroundColor = bgcolor || "";
    },


    /**
     * Resize function for the background color. This is suitable for the
     * {@link qx.ui.decoration.DynamicDecorator}.
     *
     * @param element {Element} The element which could be resized.
     * @param width {Number} The new width.
     * @param height {Number} The new height.
     * @return {Map} A map containing the desired position and dimension
     *   (width, height, top, left).
     */
    _resizeBackgroundColor : function(element, width, height) {
      var insets = this.getInsets();
      width -= insets.left + insets.right;
      height -= insets.top + insets.bottom;
      return {
        left : insets.left,
        top : insets.top,
        width : width,
        height : height
      };
    },


    // property apply
    _applyBackgroundColor : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Mixin for supporting the background images on decorators.
 * This mixin is usually used by {@link qx.ui.decoration.DynamicDecorator}.
 */
qx.Mixin.define("qx.ui.decoration.MBackgroundImage",
{
  properties :
  {
    /** The URL of the background image */
    backgroundImage :
    {
      check : "String",
      nullable : true,
      apply : "_applyBackgroundImage"
    },


    /** How the background image should be repeated */
    backgroundRepeat :
    {
      check : ["repeat", "repeat-x", "repeat-y", "no-repeat", "scale"],
      init : "repeat",
      apply : "_applyBackgroundImage"
    },


    /**
     * Either a string or a number, which defines the horizontal position
     * of the background image.
     *
     * If the value is an integer it is interpreted as a pixel value, otherwise
     * the value is taken to be a CSS value. For CSS, the values are "center",
     * "left" and "right".
     */
    backgroundPositionX :
    {
      nullable : true,
      apply : "_applyBackgroundPosition"
    },


    /**
     * Either a string or a number, which defines the vertical position
     * of the background image.
     *
     * If the value is an integer it is interpreted as a pixel value, otherwise
     * the value is taken to be a CSS value. For CSS, the values are "top",
     * "center" and "bottom".
     */
    backgroundPositionY :
    {
      nullable : true,
      apply : "_applyBackgroundPosition"
    },


    /**
     * Property group to define the background position
     */
    backgroundPosition :
    {
      group : ["backgroundPositionY", "backgroundPositionX"]
    }
  },


  members :
  {
    /**
     * Whether an info was already displayed for browsers using the AlphaImageLoader (IE6 - IE9)
     * together with the 'backgroundPosition' property. The AlphaImageLoader is not able to make use
     * of this CSS property. So the developer should be informed about this *once*.
     */
    __infoDisplayed : false,

    /**
     * Mapping for the dynamic decorator.
     *
     * @param styles {Map} CSS styles as map
     * @param content {String?null} The content of the created div as HTML
     * @return {String} The generated HTML fragment
     */
    _generateMarkup : function(styles, content) {
      return this._generateBackgroundMarkup(styles, content);
    },


    /**
     * Responsible for generating the markup for the background.
     * This method just uses the settings in the properties to generate
     * the markup.
     *
     * @param styles {Map} CSS styles as map
     * @param content {String?null} The content of the created div as HTML
     * @return {String} The generated HTML fragment
     */
    _generateBackgroundMarkup: function(styles, content)
    {
      var markup = "";

      var image = this.getBackgroundImage();
      var repeat = this.getBackgroundRepeat();

      var top = this.getBackgroundPositionY();
      if (top == null) {
        top = 0;
      }

      var left = this.getBackgroundPositionX();
      if (left == null) {
        left = 0;
      }

      styles.backgroundPosition = left + " " + top;

      // Support for images
      if (image)
      {
        var resolved = qx.util.AliasManager.getInstance().resolve(image);
        markup = qx.bom.element.Decoration.create(resolved, repeat, styles);
      }
      else
      {
        if ((qx.core.Environment.get("engine.name") == "mshtml"))
        {
          /*
           * Internet Explorer as of version 6 for quirks and standards mode,
           * or version 7 in quirks mode adds an empty string to the "div"
           * node. This behavior causes rendering problems, because the node
           * would then have a minimum size determined by the font size.
           * To be able to set the "div" node height to a certain (small)
           * value independent of the minimum font size, an "overflow:hidden"
           * style is added.
           * */
          if (parseFloat(qx.core.Environment.get("engine.version")) < 7 ||
            qx.core.Environment.get("browser.quirksmode"))
          {
            // Add additionally style
            styles.overflow = "hidden";
          }
        }

        if (!content) {
          content = "";
        }

        markup = '<div style="' + qx.bom.element.Style.compile(styles) + '">' + content + '</div>';
      }

      return markup;
    },


    // property apply
    _applyBackgroundImage : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    },

    // property apply
    _applyBackgroundPosition : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (qx.bom.element.Decoration.isAlphaImageLoaderEnabled() && !this.__infoDisplayed)
        {
          this.info("Applying a background-position value has no impact when using the 'AlphaImageLoader' to display PNG images!");
          this.__infoDisplayed = true;
        }
      }
    }
  }
});/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * A basic decorator featuring simple borders based on CSS styles.
 * This mixin is usually used by {@link qx.ui.decoration.DynamicDecorator}.
 */
qx.Mixin.define("qx.ui.decoration.MSingleBorder",
{
  properties :
  {
    /*
    ---------------------------------------------------------------------------
      PROPERTY: WIDTH
    ---------------------------------------------------------------------------
    */

    /** top width of border */
    widthTop :
    {
      check : "Number",
      init : 0,
      apply : "_applyWidth"
    },

    /** right width of border */
    widthRight :
    {
      check : "Number",
      init : 0,
      apply : "_applyWidth"
    },

    /** bottom width of border */
    widthBottom :
    {
      check : "Number",
      init : 0,
      apply : "_applyWidth"
    },

    /** left width of border */
    widthLeft :
    {
      check : "Number",
      init : 0,
      apply : "_applyWidth"
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY: STYLE
    ---------------------------------------------------------------------------
    */

    /** top style of border */
    styleTop :
    {
      nullable : true,
      check : [ "solid", "dotted", "dashed", "double"],
      init : "solid",
      apply : "_applyStyle"
    },

    /** right style of border */
    styleRight :
    {
      nullable : true,
      check : [ "solid", "dotted", "dashed", "double"],
      init : "solid",
      apply : "_applyStyle"
    },

    /** bottom style of border */
    styleBottom :
    {
      nullable : true,
      check : [ "solid", "dotted", "dashed", "double"],
      init : "solid",
      apply : "_applyStyle"
    },

    /** left style of border */
    styleLeft :
    {
      nullable : true,
      check : [ "solid", "dotted", "dashed", "double"],
      init : "solid",
      apply : "_applyStyle"
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY: COLOR
    ---------------------------------------------------------------------------
    */

    /** top color of border */
    colorTop :
    {
      nullable : true,
      check : "Color",
      apply : "_applyStyle"
    },

    /** right color of border */
    colorRight :
    {
      nullable : true,
      check : "Color",
      apply : "_applyStyle"
    },

    /** bottom color of border */
    colorBottom :
    {
      nullable : true,
      check : "Color",
      apply : "_applyStyle"
    },

    /** left color of border */
    colorLeft :
    {
      nullable : true,
      check : "Color",
      apply : "_applyStyle"
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY GROUP: EDGE
    ---------------------------------------------------------------------------
    */

    /** Property group to configure the left border */
    left : {
      group : [ "widthLeft", "styleLeft", "colorLeft" ]
    },

    /** Property group to configure the right border */
    right : {
      group : [ "widthRight", "styleRight", "colorRight" ]
    },

    /** Property group to configure the top border */
    top : {
      group : [ "widthTop", "styleTop", "colorTop" ]
    },

    /** Property group to configure the bottom border */
    bottom : {
      group : [ "widthBottom", "styleBottom", "colorBottom" ]
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY GROUP: TYPE
    ---------------------------------------------------------------------------
    */

    /** Property group to set the border width of all sides */
    width :
    {
      group : [ "widthTop", "widthRight", "widthBottom", "widthLeft" ],
      mode : "shorthand"
    },

    /** Property group to set the border style of all sides */
    style :
    {
      group : [ "styleTop", "styleRight", "styleBottom", "styleLeft" ],
      mode : "shorthand"
    },

    /** Property group to set the border color of all sides */
    color :
    {
      group : [ "colorTop", "colorRight", "colorBottom", "colorLeft" ],
      mode : "shorthand"
    }
  },


  members :
  {
    /**
     * Takes a styles map and adds the border styles styles in place
     * to the given map. This is the needed behavior for
     * {@link qx.ui.decoration.DynamicDecorator}.
     *
     * @param styles {Map} A map to add the styles.
     */
    _styleBorder : function(styles)
    {
      if (qx.core.Environment.get("qx.theme"))
      {
        var Color = qx.theme.manager.Color.getInstance();

        var colorTop = Color.resolve(this.getColorTop());
        var colorRight = Color.resolve(this.getColorRight());
        var colorBottom = Color.resolve(this.getColorBottom());
        var colorLeft = Color.resolve(this.getColorLeft());
      }
      else
      {
        var colorTop = this.getColorTop();
        var colorRight = this.getColorRight();
        var colorBottom = this.getColorBottom();
        var colorLeft = this.getColorLeft();
      }

      // Add borders
      var width = this.getWidthTop();
      if (width > 0) {
        styles["border-top"] = width + "px " + this.getStyleTop() + " " + (colorTop || "");
      }

      var width = this.getWidthRight();
      if (width > 0) {
        styles["border-right"] = width + "px " + this.getStyleRight() + " " + (colorRight || "");
      }

      var width = this.getWidthBottom();
      if (width > 0) {
        styles["border-bottom"] = width + "px " + this.getStyleBottom() + " " + (colorBottom || "");
      }

      var width = this.getWidthLeft();
      if (width > 0) {
        styles["border-left"] = width + "px " + this.getStyleLeft() + " " + (colorLeft || "");
      }

      // Check if valid
      if (qx.core.Environment.get("qx.debug"))
      {
        if (styles.length === 0) {
          throw new Error("Invalid Single decorator (zero border width). Use qx.ui.decorator.Background instead!");
        }
      }

      // Add basic styles
      styles.position = "absolute";
      styles.top = 0;
      styles.left = 0;
    },


    /**
     * Resize function for the decorator. This is suitable for the
     * {@link qx.ui.decoration.DynamicDecorator}.
     *
     * @param element {Element} The element which could be resized.
     * @param width {Number} The new width.
     * @param height {Number} The new height.
     * @return {Map} A map containing the desired position and dimension.
     *   (width, height, top, left).
     */
    _resizeBorder : function(element, width, height) {
      var insets = this.getInsets();
      width -= insets.left + insets.right;
      height -= insets.top + insets.bottom;

      // Fix to keep applied size above zero
      // Makes issues in IE7 when applying value like '-4px'
      if (width < 0) {
        width = 0;
      }

      if (height < 0) {
        height = 0;
      }

      return {
        left : insets.left - this.getWidthLeft(),
        top : insets.top - this.getWidthTop(),
        width : width,
        height : height
      };
    },



    /**
     * Implementation of the interface for the single border.
     *
     * @return {Map} A map containing the default insets.
     *   (top, right, bottom, left)
     */
    _getDefaultInsetsForBorder : function()
    {
      return {
        top : this.getWidthTop(),
        right : this.getWidthRight(),
        bottom : this.getWidthBottom(),
        left : this.getWidthLeft()
      };
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyWidth : function()
    {
      this._applyStyle();

      this._resetInsets();
    },


    // property apply
    _applyStyle : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._markup) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A basic decorator featuring background colors and simple borders based on
 * CSS styles.
 */
qx.Class.define("qx.ui.decoration.Single",
{
  extend : qx.ui.decoration.Abstract,
  include : [
    qx.ui.decoration.MBackgroundImage,
    qx.ui.decoration.MBackgroundColor,
    qx.ui.decoration.MSingleBorder
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param width {Integer} Width of the border
   * @param style {String} Any supported border style
   * @param color {Color} The border color
   */
  construct : function(width, style, color)
  {
    this.base(arguments);

    // Initialize properties
    if (width != null) {
      this.setWidth(width);
    }

    if (style != null) {
      this.setStyle(style);
    }

    if (color != null) {
      this.setColor(color);
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    _markup : null,


    /*
    ---------------------------------------------------------------------------
      INTERFACE IMPLEMENTATION
    ---------------------------------------------------------------------------
    */

    // interface implementation
    getMarkup : function()
    {
      if (this._markup) {
        return this._markup;
      }

      var styles = {};

      // get the single border styles
      this._styleBorder(styles);

      var html = this._generateBackgroundMarkup(styles);

      return this._markup = html;
    },


    // interface implementation
    resize : function(element, width, height) {
      // get the width and height of the mixins
      var pos = this._resizeBorder(element, width, height);

      element.style.width = pos.width + "px";
      element.style.height = pos.height + "px";

      element.style.left = pos.left + "px";
      element.style.top = pos.top + "px";
    },


    // interface implementation
    tint : function(element, bgcolor) {
      this._tintBackgroundColor(element, bgcolor, element.style);
    },


    // overridden
    _isInitialized: function() {
      return !!this._markup;
    },


    // overridden
    _getDefaultInsets : function() {
      return this._getDefaultInsetsForBorder();
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._markup = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Defines the methods needed by every marshaler which should work with the
 * qooxdoo data stores.
 */
qx.Interface.define("qx.data.marshal.IMarshaler",
{
  members :
  {
    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code>. Two objects containing the same keys will not
     * create two different classes.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass : function(data, includeBubbleEvents) {},


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel : function(data) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class is responsible for converting json data to class instances
 * including the creation of the classes.
 */
qx.Class.define("qx.data.marshal.Json",
{
  extend : qx.core.Object,
  implement : [qx.data.marshal.IMarshaler],

  /**
   * @param delegate {Object} An object containing one of the methods described
   *   in {@link qx.data.marshal.IMarshalerDelegate}.
   */
  construct : function(delegate)
  {
    this.base(arguments);

    this.__delegate = delegate;
  },

  statics :
  {
    $$instance : null,

    /**
     * Creates a qooxdoo object based on the given json data. This function
     * is just a static wrapper. If you want to configure the creation
     * process of the class, use {@link qx.data.marshal.Json} directly.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     *
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    createModel : function(data, includeBubbleEvents) {
      // singleton for the json marshaler
      if (this.$$instance === null) {
        this.$$instance = new qx.data.marshal.Json();
      }
      // be sure to create the classes first
      this.$$instance.toClass(data, includeBubbleEvents);
      // return the model
      return this.$$instance.toModel(data);
    }
  },


  members :
  {
    __delegate : null,


    /**
     * Converts a given object into a hash which will be used to identify the
     * classes under the namespace <code>qx.data.model</code>.
     *
     * @param data {Object} The JavaScript object from which the hash is
     *   required.
     * @return {String} The hash representation of the given JavaScript object.
     */
    __jsonToHash: function(data) {
      return Object.keys(data).sort().join('"');
    },


    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code> and the hash of the data created by
     * {@link #__jsonToHash}. Two objects containing the same keys will not
     * create two different classes. The class creation process also supports
     * the functions provided by its delegate.
     *
     * Important, please keep in mind that only valid JavaScript identifiers
     * can be used as keys in the data map. For convenience '-' in keys will
     * be removed (a-b will be ab in the end).
     *
     * @see qx.data.store.IStoreDelegate
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass: function(data, includeBubbleEvents) {
      this.__toClass(data, includeBubbleEvents, null, 0);
    },


    /**
     * Implementation of {@link #toClass} used for recursion.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     */
    __toClass : function(data, includeBubbleEvents, parentProperty, depth) {
      // break on all primitive json types and qooxdoo objects
      if (
        !qx.lang.Type.isObject(data)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        // check for arrays
        if (data instanceof Array || qx.Bootstrap.getClass(data) == "Array") {
          for (var i = 0; i < data.length; i++) {
            this.__toClass(data[i], includeBubbleEvents, null, depth+1);
          }
        }

        // ignore arrays and primitive types
        return;
      }

      var hash = this.__jsonToHash(data);

      // ignore rules
      if (this.__ignore(hash, parentProperty, depth)) {
        return;
      }

      // check for the possible child classes
      for (var key in data) {
        this.__toClass(data[key], includeBubbleEvents, key, depth+1);
      }

      // class already exists
      if (qx.Class.isDefined("qx.data.model." + hash)) {
        return;
      }

      // class is defined by the delegate
      if (
        this.__delegate
        && this.__delegate.getModelClass
        && this.__delegate.getModelClass(hash) != null
      ) {
        return;
      }

      // create the properties map
      var properties = {};
      // include the disposeItem for the dispose process.
      var members = {__disposeItem : this.__disposeItem};
      for (var key in data) {
        // apply the property names mapping
        if (this.__delegate && this.__delegate.getPropertyMapping) {
          key = this.__delegate.getPropertyMapping(key, hash);
        }

        // stip the unwanted characters
        key = key.replace(/-|\.|\s+/g, "");
        // check for valid JavaScript identifier (leading numbers are ok)
        if (qx.core.Environment.get("qx.debug")) {
          this.assertTrue((/^[$0-9A-Za-z_]*$/).test(key),
          "The key '" + key + "' is not a valid JavaScript identifier.")
        }

        properties[key] = {};
        properties[key].nullable = true;
        properties[key].event = "change" + qx.lang.String.firstUp(key);
        // bubble events
        if (includeBubbleEvents) {
          properties[key].apply = "_applyEventPropagation";
        }
        // validation rules
        if (this.__delegate && this.__delegate.getValidationRule) {
          var rule = this.__delegate.getValidationRule(hash, key);
          if (rule) {
            properties[key].validate = "_validate" + key;
            members["_validate" + key] = rule;
          }
        }
      }

      // try to get the superclass, qx.core.Object as default
      if (this.__delegate && this.__delegate.getModelSuperClass) {
        var superClass =
          this.__delegate.getModelSuperClass(hash) || qx.core.Object;
      } else {
        var superClass = qx.core.Object;
      }

      // try to get the mixins
      var mixins = [];
      if (this.__delegate && this.__delegate.getModelMixins) {
        var delegateMixins = this.__delegate.getModelMixins(hash);
        // check if its an array
        if (!qx.lang.Type.isArray(delegateMixins)) {
          if (delegateMixins != null) {
            mixins = [delegateMixins];
          }
        } else {
          mixins = delegateMixins;
        }
      }

      // include the mixin for the event bubbling
      if (includeBubbleEvents) {
        mixins.push(qx.data.marshal.MEventBubbling);
      }

      // create the map for the class
      var newClass = {
        extend : superClass,
        include : mixins,
        properties : properties,
        members : members,
        destruct : this.__disposeProperties
      };

      qx.Class.define("qx.data.model." + hash, newClass);
    },


    /**
     * Destructor for all created classes which disposes all stuff stored in
     * the properties.
     */
    __disposeProperties : function() {
      var properties = qx.util.PropertyUtil.getAllProperties(this.constructor);
      for (var desc in properties) {
        this.__disposeItem(this.get(properties[desc].name));
      };
    },


    /**
     * Helper for disposing items of the created class.
     *
     * @param item {var} The item to dispose.
     */
    __disposeItem : function(item) {
      if (!(item instanceof qx.core.Object)) {
        // ignore all non objects
        return;
      }
      // ignore already disposed items (could happen during shutdown)
      if (item.isDisposed()) {
        return;
      }
      item.dispose();
    },


    /**
     * Creates an instance for the given data hash.
     *
     * @param hash {String} The hash of the data for which an instance should
     *   be created.
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    __createInstance: function(hash) {
      var delegateClass;
      // get the class from the delegate
      if (this.__delegate && this.__delegate.getModelClass) {
        delegateClass = this.__delegate.getModelClass(hash);
      }
      if (delegateClass != null) {
        return (new delegateClass());
      } else {
        var clazz = qx.Class.getByName("qx.data.model." + hash);
        return (new clazz());
      }
    },


    /**
     * Helper to decide if the delegate decides to ignore a data set.
     * @param hash {String} The property names.
     * @param parentProperty {String|null} The name of the property the data
     *   will be stored in.
     * @param depth {Number} The depth of the object relative to the data root.
     * @return {Boolean} <code>true</code> if the set should be ignored
     */
    __ignore : function(hash, parentProperty, depth) {
      var del = this.__delegate;
      return del && del.ignore && del.ignore(hash, parentProperty, depth);
    },


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method. The creation
     * of the class itself is delegated to the {@link #__createInstance} method,
     * which could use the {@link qx.data.store.IStoreDelegate} methods, if
     * given.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel: function(data) {
      return this.__toModel(data, null, 0);
    },


    /**
     * Implementation of {@link #toModel} used for recursion.
     *
     * @param data {Object} The object for which models should be created.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     * @return {qx.core.Object} The created model object.
     */
    __toModel: function(data, parentProperty, depth) {
      var isObject = qx.lang.Type.isObject(data);
      var isArray = data instanceof Array || qx.Bootstrap.getClass(data) == "Array";

      if (
        (!isObject && !isArray)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        return data;

      // ignore rules
      } else if (this.__ignore(this.__jsonToHash(data), parentProperty, depth)) {
        return data;

      } else if (isArray) {
        var array = new qx.data.Array();
        // set the auto dispose for the array
        array.setAutoDisposeItems(true);

        for (var i = 0; i < data.length; i++) {
          array.push(this.__toModel(data[i], null, depth+1));
        }
        return array;

      } else if (isObject) {
        // create an instance for the object
        var hash = this.__jsonToHash(data);
        var model = this.__createInstance(hash);

        // go threw all element in the data
        for (var key in data) {
          // apply the property names mapping
          var propertyName = key;
          if (this.__delegate && this.__delegate.getPropertyMapping) {
            propertyName = this.__delegate.getPropertyMapping(key, hash);
          }
          var propertyNameReplaced = propertyName.replace(/-|\.|\s+/g, "");
          // warn if there has been a replacement
          if (
            (qx.core.Environment.get("qx.debug")) &&
            qx.core.Environment.get("qx.debug.databinding")
          ) {
            if (propertyNameReplaced != propertyName) {
              this.warn(
                "The model contained an illegal name: '" + key +
                "'. Replaced it with '" + propertyName + "'."
              );
            }
          }
          propertyName = propertyNameReplaced;
          // only set the properties if they are available [BUG #5909]
          var setterName = "set" + qx.lang.String.firstUp(propertyName);
          if (model[setterName]) {
            model[setterName](this.__toModel(data[key], key, depth+1));
          }
        }
        return model;
      }

      throw new Error("Unsupported type!");
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__delegate = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin used for the bubbling events. If you want to use this in your own model
 * classes, be sure that every property will call the
 * {@link #_applyEventPropagation} function on every change.
 */
qx.Mixin.define("qx.data.marshal.MEventBubbling",
{

  events :
  {
    /**
     * The change event which will be fired on every change in the model no
     * matter what property changes. This event bubbles so the root model will
     * fire a change event on every change of its children properties too.
     *
     * Note that properties are required to call
     * {@link #_applyEventPropagation} on apply for changes to be tracked as
     * desired. It is already taken care of that properties created with the
     * {@link qx.data.marshal.Json} marshaler call this method.
     *
     * The data will contain a map with the following three keys
     *   <li>value: The new value of the property</li>
     *   <li>old: The old value of the property.</li>
     *   <li>name: The name of the property changed including its parent
     *     properties separated by dots.</li>
     *   <li>item: The item which has the changed property.</li>
     * Due to that, the <code>getOldData</code> method will always return null
     * because the old data is contained in the map.
     */
    "changeBubble": "qx.event.type.Data"
  },


  members :
  {
    /**
     * Apply function for every property created with the
     * {@link qx.data.marshal.Json} marshaler. It fires and
     * {@link #changeBubble} event on every change. It also adds the chaining
     * listener if possible which is necessary for the bubbling of the events.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _applyEventPropagation : function(value, old, name)
    {
      this.fireDataEvent("changeBubble", {
        value: value, name: name, old: old, item: this
      });

      this._registerEventChaining(value, old, name);
    },


    /**
     * Registers for the given parameters the changeBubble listener, if
     * possible. It also removes the old listener, if an old item with
     * a changeBubble event is given.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _registerEventChaining : function(value, old, name)
    {
      // if an old value is given, remove the old listener if possible
      if (old != null && old.getUserData && old.getUserData("idBubble-" + this.$$hash) != null) {
        var listeners = old.getUserData("idBubble-" + this.$$hash);
        for (var i = 0; i < listeners.length; i++) {
          old.removeListenerById(listeners[i]);
        }
        old.setUserData("idBubble-" + this.$$hash, null);
      }

      // if the child supports chaining
      if ((value instanceof qx.core.Object)
        && qx.Class.hasMixin(value.constructor, qx.data.marshal.MEventBubbling)
      ) {
        // create the listener
        var listener = qx.lang.Function.bind(
          this.__changePropertyListener, this, name
        );
        // add the listener
        var id = value.addListener("changeBubble", listener, this);
        var listeners = value.getUserData("idBubble-" + this.$$hash);
        if (listeners == null)
        {
          listeners = [];
          value.setUserData("idBubble-" + this.$$hash, listeners);
        }
        listeners.push(id);
      }
    },


    /**
     * Listener responsible for formating the name and firing the change event
     * for the changed property.
     *
     * @param name {String} The name of the former properties.
     * @param e {qx.event.type.Data} The date event fired by the property
     *   change.
     */
    __changePropertyListener : function(name, e)
    {
      var data = e.getData();
      var value = data.value;
      var old = data.old;

      // if the target is an array
      if (qx.Class.hasInterface(e.getTarget().constructor, qx.data.IListData)) {

        if (data.name.indexOf) {
          var dotIndex = data.name.indexOf(".") != -1 ? data.name.indexOf(".") : data.name.length;
          var bracketIndex = data.name.indexOf("[") != -1 ? data.name.indexOf("[") : data.name.length;

          // braktes in the first spot is ok [BUG #5985]
          if (bracketIndex == 0) {
            var newName = name + data.name;
          } else if (dotIndex < bracketIndex) {
            var index = data.name.substring(0, dotIndex);
            var rest = data.name.substring(dotIndex + 1, data.name.length);
            if (rest[0] != "[") {
              rest = "." + rest;
            }
            var newName =  name + "[" + index + "]" + rest;
          } else if (bracketIndex < dotIndex) {
            var index = data.name.substring(0, bracketIndex);
            var rest = data.name.substring(bracketIndex, data.name.length);
            var newName =  name + "[" + index + "]" + rest;
          } else {
            var newName =  name + "[" + data.name + "]";
          }
        } else {
          var newName =  name + "[" + data.name + "]";
        }

      // if the target is not an array
      } else {
        // special case for array as first element of the chain [BUG #5985]
        if (parseInt(name) == name && name !== "") {
          name = "[" + name + "]";
        }
        var newName =  name + "." + data.name;
      }

      this.fireDataEvent(
        "changeBubble",
        {
          value: value,
          name: newName,
          old: old,
          item: data.item || e.getTarget()
        }
      );
    }
  }
});/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The data array is a special array used in the data binding context of
 * qooxdoo. It does not extend the native array of JavaScript but its a wrapper
 * for it. All the native methods are included in the implementation and it
 * also fires events if the content or the length of the array changes in
 * any way. Also the <code>.length</code> property is available on the array.
 */
qx.Class.define("qx.data.Array",
{
  extend : qx.core.Object,
  include : qx.data.marshal.MEventBubbling,
  implement : [qx.data.IListData],

  /**
   * Creates a new instance of an array.
   *
   * @param param {var} The parameter can be some types.<br/>
   *   Without a parameter a new blank array will be created.<br/>
   *   If there is more than one parameter is given, the parameter will be
   *   added directly to the new array.<br/>
   *   If the parameter is a number, a new Array with the given length will be
   *   created.<br/>
   *   If the parameter is a JavaScript array, a new array containing the given
   *   elements will be created.
   */
  construct : function(param)
  {
    this.base(arguments);
    // if no argument is given
    if (param == undefined) {
      this.__array = [];

    // check for elements (create the array)
    } else if (arguments.length > 1) {
      // create an empty array and go through every argument and push it
      this.__array = [];
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
      }

    // check for a number (length)
    } else if (typeof param == "number") {
      this.__array = new Array(param);
    // check for an array itself
    } else if (param instanceof Array) {
      this.__array = qx.lang.Array.clone(param);

    // error case
    } else {
      this.__array = [];
      this.dispose();
      throw new Error("Type of the parameter not supported!");
    }

    // propagate changes
    for (var i=0; i<this.__array.length; i++) {
      this._applyEventPropagation(this.__array[i], null, i);
    }

    // update the length at startup
    this.__updateLength();

    // work against the console printout of the array
    if (qx.core.Environment.get("qx.debug")) {
      this[0] = "Please use 'toArray()' to see the content.";
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Flag to set the dispose behavior of the array. If the property is set to
     * <code>true</code>, the array will dispose its content on dispose, too.
     */
    autoDisposeItems : {
      check : "Boolean",
      init : false
    }
  },

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * The change event which will be fired if there is a change in the array.
     * The data contains a map with three key value pairs:
     * <li>start: The start index of the change.</li>
     * <li>end: The end index of the change.</li>
     * <li>type: The type of the change as a String. This can be 'add',
     * 'remove' or 'order'</li>
     * <li>items: The items which has been changed (as a JavaScript array).</li>
     */
    "change" : "qx.event.type.Data",


    /**
     * The changeLength event will be fired every time the length of the
     * array changes.
     */
    "changeLength": "qx.event.type.Data"
  },


  members :
  {
    // private members
    __array : null,


    /**
     * Concatenates the current and the given array into a new one.
     *
     * @param array {Array} The javaScript array which should be concatenated
     *   to the current array.
     *
     * @return {qx.data.Array} A new array containing the values of both former
     *   arrays.
     */
    concat: function(array) {
      if (array) {
        var newArray = this.__array.concat(array);
      } else {
        var newArray = this.__array.concat();
      }
      return new qx.data.Array(newArray);
    },


    /**
     * Returns the array as a string using the given connector string to
     * connect the values.
     *
     * @param connector {String} the string which should be used to past in
     *  between of the array values.
     *
     * @return {String} The array as a string.
     */
    join: function(connector) {
      return this.__array.join(connector);
    },


    /**
     * Removes and returns the last element of the array.
     * An change event will be fired.
     *
     * @return {var} The last element of the array.
     */
    pop: function() {
      var item = this.__array.pop();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length - 1);
      // fire change bubble event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: this.length + "",
        old: [item],
        item: this
      });

      this.fireDataEvent("change",
        {
          start: this.length - 1,
          end: this.length - 1,
          type: "remove",
          items: [item]
        }, null
      );
      return item;
    },


    /**
     * Adds an element at the end of the array.
     *
     * @param varargs {var} Multiple elements. Every element will be added to
     *   the end of the array. An change event will be fired.
     *
     * @return {Number} The new length of the array.
     */
    push: function(varargs) {
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
        this.__updateLength();
        // apply to every pushed item an event listener for the bubbling
        this._registerEventChaining(arguments[i], null, this.length - 1);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [arguments[i]],
          name: (this.length - 1) + "",
          old: [],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: this.length - 1,
            end: this.length - 1,
            type: "add",
            items: [arguments[i]]
          }, null
        );
      }
      return this.length;
    },


    /**
     * Reverses the order of the array. An change event will be fired.
     */
    reverse: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var oldArray = this.__array.concat();
      this.__array.reverse();

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", items: null}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.__array.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Removes the first element of the array and returns it. An change event
     * will be fired.
     *
     * @return {var} the former first element.
     */
    shift: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var item = this.__array.shift();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length -1);
      // as every item has changed its position, we need to update the event bubbling
      this.__updateEventPropagation(0, this.length);

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0",
        old: [item],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: this.length -1,
          type: "remove",
          items: [item]
        }, null
      );
      return item;
    },


    /**
     * Returns a new array based on the range specified by the parameters.
     *
     * @param from {Number} The start index.
     * @param to {Number?null} The end index. If omitted, slice extracts to the
     *   end of the array.
     *
     * @return {qx.data.Array} A new array containing the given range of values.
     */
    slice: function(from, to) {
      return new qx.data.Array(this.__array.slice(from, to));
    },


    /**
     * Method to remove and add new elements to the array. For every remove or
     * add an event will be fired.
     *
     * @param startIndex {Integer} The index where the splice should start
     * @param amount {Integer} Defines number of elements which will be removed
     *   at the given position.
     * @param varargs {var} All following parameters will be added at the given
     *   position to the array.
     * @return {qx.data.Array} An data array containing the removed elements.
     *   Keep in to dispose this one, even if you don't use it!
     */
    splice: function(startIndex, amount, varargs) {
      // store the old length
      var oldLength = this.__array.length;

      // invoke the slice on the array
      var returnArray = this.__array.splice.apply(this.__array, arguments);

      // fire a change event for the length
      if (this.__array.length != oldLength) {
        this.__updateLength();
      }
      // fire an event for the change
      var removed = amount > 0;
      var added = arguments.length > 2;
      var items = null;
      if (removed || added) {
        if (this.__array.length > oldLength) {
          var type = "add";
          items = qx.lang.Array.fromArguments(arguments, 2);
        } else if (this.__array.length < oldLength) {
          var type = "remove";
          items = returnArray;
        } else {
          var type = "order";
        }
        this.fireDataEvent("change",
          {
            start: startIndex,
            end: this.length - 1,
            type: type,
            items: items
          }, null
        );
      }
      // add listeners
      for (var i = 2; i < arguments.length; i++) {
        this._registerEventChaining(arguments[i], null, startIndex + i);
      }
      // apply event chaining for every item moved
      this.__updateEventPropagation(startIndex + arguments.length - 2, this.length);

      // fire the changeBubble event
      var value = [];
      for (var i=2; i < arguments.length; i++) {
        value[i-2] = arguments[i];
      };
      var endIndex = (startIndex + Math.max(arguments.length - 3 , amount - 1));
      var name = startIndex == endIndex ? endIndex : startIndex + "-" + endIndex;
      this.fireDataEvent("changeBubble", {
        value: value, name: name + "", old: returnArray, item: this
      });

      // remove the listeners
      for (var i = 0; i < returnArray.length; i++) {
        this._registerEventChaining(null, returnArray[i], i);
      }
      return (new qx.data.Array(returnArray));
    },


    /**
     * Sorts the array. If a function is given, this will be used to
     * compare the items. <code>changeBubble</code> event will only be fired,
     * if sorting result differs from original array.
     *
     * @param func {Function} A compare function comparing two parameters and
     *   should return a number.
     */
    sort: function(func) {
      // ignore if the array is empty
      if (this.length == 0) {
        return;
      }
      var oldArray = this.__array.concat();

      this.__array.sort.apply(this.__array, arguments);

      // prevent changeBubble event if nothing has been changed
      if (qx.lang.Array.equals(this.__array, oldArray) === true){
        return;
      }

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", items: null}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Adds the given items to the beginning of the array. For every element,
     * a change event will be fired.
     *
     * @param varargs {var} As many elements as you want to add to the beginning.
     * @return {Integer} The new length of the array
     */
    unshift: function(varargs) {
      for (var i = arguments.length - 1; i >= 0; i--) {
        this.__array.unshift(arguments[i]);
        this.__updateLength();
        // apply to every item an event listener for the bubbling
        this.__updateEventPropagation(0, this.length);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [this.__array[0]],
          name: "0",
          old: [this.__array[1]],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: 0,
            end: this.length - 1,
            type: "add",
            items: [arguments[i]]
          }, null
        );
      }
      return this.length;
    },


    /**
     * Returns the list data as native array. Beware of the fact that the
     * internal representation will be returnd and any manipulation of that
     * can cause a misbehavior of the array. This method should only be used for
     * debugging purposes.
     *
     * @return {Array} The native array.
     */
    toArray: function() {
      return this.__array;
    },


    /**
     * Replacement function for the getting of the array value.
     * array[0] should be array.getItem(0).
     *
     * @param index {Number} The index requested of the array element.
     *
     * @return {var} The element at the given index.
     */
    getItem: function(index) {
      return this.__array[index];
    },


    /**
     * Replacement function for the setting of an array value.
     * array[0] = "a" should be array.setItem(0, "a").
     * A change event will be fired if the value changes. Setting the same
     * value again will not lead to a change event.
     *
     * @param index {Number} The index of the array element.
     * @param item {var} The new item to set.
     */
    setItem: function(index, item) {
      var oldItem = this.__array[index];
      // ignore settings of already set items [BUG #4106]
      if (oldItem === item) {
        return;
      }
      this.__array[index] = item;
      // set an event listener for the bubbling
      this._registerEventChaining(item, oldItem, index);
      // only update the length if its changed
      if (this.length != this.__array.length) {
        this.__updateLength();
      }

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [item],
        name: index + "",
        old: [oldItem],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: index,
          end: index,
          type: "add",
          items: [item]
        }, null
      );
    },


    /**
     * This method returns the current length stored under .length on each
     * array.
     *
     * @return {Number} The current length of the array.
     */
    getLength: function() {
      return this.length;
    },


    /**
     * Returns the index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    indexOf: function(item) {
      return this.__array.indexOf(item);
    },


    /**
     * Returns the toString of the original Array
     * @return {String} The array as a string.
     */
    toString: function() {
      if (this.__array != null) {
        return this.__array.toString();
      }
      return "";
    },


    /*
    ---------------------------------------------------------------------------
       IMPLEMENTATION OF THE QX.LANG.ARRAY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Check if the given item is in the current array.
     *
     * @param item {var} The item which is possibly in the array.
     * @return {Boolean} true, if the array contains the given item.
     */
    contains: function(item) {
      return this.__array.indexOf(item) !== -1;
    },


    /**
     * Return a copy of the given arr
     *
     * @return {qx.data.Array} copy of this
     */
    copy : function() {
      return this.concat();
    },


    /**
     * Insert an element at a given position.
     *
     * @param index {Integer} Position where to insert the item.
     * @param item {var} The element to insert.
     */
    insertAt : function(index, item)
    {
      this.splice(index, 0, item).dispose();
    },


    /**
     * Insert an item into the array before a given item.
     *
     * @param before {var} Insert item before this object.
     * @param item {var} The item to be inserted.
     */
    insertBefore : function(before, item)
    {
      var index = this.indexOf(before);

      if (index == -1) {
        this.push(item);
      } else {
        this.splice(index, 0, item).dispose();
      }
    },


    /**
     * Insert an element into the array after a given item.
     *
     * @param after {var} Insert item after this object.
     * @param item {var} Object to be inserted.
     */
    insertAfter : function(after, item)
    {
      var index = this.indexOf(after);

      if (index == -1 || index == (this.length - 1)) {
        this.push(item);
      } else {
        this.splice(index + 1, 0, item).dispose();
      }
    },


    /**
     * Remove an element from the array at the given index.
     *
     * @param index {Integer} Index of the item to be removed.
     * @return {var} The removed item.
     */
    removeAt : function(index) {
      var returnArray = this.splice(index, 1);
      var item = returnArray.getItem(0);
      returnArray.dispose();
      return item;
    },


    /**
     * Remove all elements from the array.
     *
     * @return {Array} A native array containing the removed elements.
     */
    removeAll : function() {
      // remove all possible added event listeners
      for (var i = 0; i < this.__array.length; i++) {
        this._registerEventChaining(null, this.__array[i], i);
      }

      // ignore if array is empty
      if (this.getLength() == 0) {
        return [];
      }

      // store the old data
      var oldLength = this.getLength();
      var items = this.__array.concat();

      // change the length
      this.__array.length = 0;
      this.__updateLength();

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0-" + (oldLength - 1),
        old: items,
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: oldLength - 1,
          type: "remove",
          items: items
        }, null
      );
      return items;
    },


    /**
     * Append the items of the given array.
     *
     * @param array {Array|qx.data.IListData} The items of this array will
     * be appended.
     * @throws {Error} if the second argument is not an array.
     */
    append : function(array)
    {
      // qooxdoo array support
      if (array instanceof qx.data.Array) {
        array = array.toArray();
      }

      // this check is important because opera throws an uncatchable error if
      // apply is called without an array as argument.
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertArray(array, "The parameter must be an array.");
      }

      Array.prototype.push.apply(this.__array, array);

      // add a listener to the new items
      for (var i = 0; i < array.length; i++) {
        this._registerEventChaining(array[i], null, this.__array.length + i);
      }

      var oldLength = this.length;
      this.__updateLength();

      // fire change bubbles
      var name =
        oldLength == (this.length-1) ?
        oldLength :
        oldLength + "-" + (this.length-1);
      this.fireDataEvent("changeBubble", {
        value: array,
        name: name + "",
        old: [],
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: oldLength,
          end: this.length - 1,
          type: "add",
          items: array
        }, null
      );
    },


    /**
     * Remove the given item.
     *
     * @param item {var} Item to be removed from the array.
     * @return {var} The removed item.
     */
    remove : function(item)
    {
      var index = this.indexOf(item);

      if (index != -1)
      {
        this.splice(index, 1).dispose();
        return item;
      }
    },


    /**
     * Check whether the given array has the same content as this.
     * Checks only the equality of the arrays' content.
     *
     * @param array {qx.data.Array} The array to check.
     * @return {Boolean} Whether the two arrays are equal.
     */
    equals : function(array)
    {
      if (this.length !== array.length) {
        return false;
      }

      for (var i = 0; i < this.length; i++)
      {
        if (this.getItem(i) !== array.getItem(i)) {
          return false;
        }
      }

      return true;
    },


    /**
     * Returns the sum of all values in the array. Supports
     * numeric values only.
     *
     * @return {Number} The sum of all values.
     */
    sum : function()
    {
      var result = 0;
      for (var i = 0; i < this.length; i++) {
        result += this.getItem(i);
      }

      return result;
    },


    /**
     * Returns the highest value in the given array.
     * Supports numeric values only.
     *
     * @return {Number | null} The highest of all values or undefined if the
     *   array is empty.
     */
    max : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) > result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Returns the lowest value in the array. Supports
     * numeric values only.
     *
     * @return {Number | null} The lowest of all values or undefined
     *   if the array is empty.
     */
    min : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) < result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Invokes the given function for every item in the array.
     *
     * @param callback {Function} The function which will be call for every
     *   item in the array. It will be invoked with three parameters:
     *   the item, the index and the array itself.
     * @param context {var} The context in which the callback will be invoked.
     */
    forEach : function(callback, context)
    {
      for (var i = 0; i < this.__array.length; i++) {
        callback.call(context, this.__array[i], i, this);
      }
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Internal function which updates the length property of the array.
     * Every time the length will be updated, a {@link #changeLength} data
     * event will be fired.
     */
    __updateLength: function() {
      var oldLength = this.length;
      this.length = this.__array.length;
      this.fireDataEvent("changeLength", this.length, oldLength);
    },


    /**
     * Helper to update the event propagation for a range of items.
     * @param from {Number} Start index.
     * @param to {Number} End index.
     */
    __updateEventPropagation : function(from, to) {
      for (var i=from; i < to; i++) {
        this._registerEventChaining(this.__array[i], this.__array[i], i);
      };
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
  */

  destruct : function() {
    for (var i = 0; i < this.__array.length; i++) {
      var item = this.__array[i];
      this._applyEventPropagation(null, item, i);

      // dispose the items on auto dispose
      if (this.isAutoDisposeItems() && item && item instanceof qx.core.Object) {
        item.dispose();
      }
    }

    this.__array = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */


/**
 * <h2>Object Controller</h2>
 *
 * *General idea*
 *
 * The idea of the object controller is to make the binding of one model object
 * containing one or more properties as easy as possible. Therefore the
 * controller can take a model as property. Every property in that model can be
 * bound to one or more target properties. The binding will be for
 * atomic types only like Numbers, Strings, ...
 *
 * *Features*
 *
 * * Manages the bindings between the model properties and the different targets
 * * No need for the user to take care of the binding ids
 * * Can create an bidirectional binding (read- / write-binding)
 * * Handles the change of the model which means adding the old targets
 *
 * *Usage*
 *
 * The controller only can work if a model is set. If the model property is
 * null, the controller is not working. But it can be null on any time.
 *
 * *Cross reference*
 *
 * * If you want to bind a list like widget, use {@link qx.data.controller.List}
 * * If you want to bind a tree widget, use {@link qx.data.controller.Tree}
 * * If you want to bind a form widget, use {@link qx.data.controller.Form}
 */
qx.Class.define("qx.data.controller.Object",
{
  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param model {qx.core.Object?null} The model for the model property.
   */
  construct : function(model)
  {
    this.base(arguments);

    // create a map for all created binding ids
    this.__bindings = {};
    // create an array to store all current targets
    this.__targets = [];

    if (model != null) {
      this.setModel(model);
    }
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The model object which does have the properties for the binding. */
    model :
    {
      check: "qx.core.Object",
      event: "changeModel",
      apply: "_applyModel",
      nullable: true,
      dereference: true
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // private members
    __targets : null,
    __bindings : null,

    /**
     * Apply-method which will be called if a new model has been set.
     * All bindings will be moved to the new model.
     *
     * @param value {qx.core.Object|null} The new model.
     * @param old {qx.core.Object|null} The old model.
     */
    _applyModel: function(value, old) {
      // for every target
      for (var i = 0; i < this.__targets.length; i++) {
        // get the properties
        var targetObject = this.__targets[i][0];
        var targetProperty = this.__targets[i][1];
        var sourceProperty = this.__targets[i][2];
        var bidirectional = this.__targets[i][3];
        var options = this.__targets[i][4];
        var reverseOptions = this.__targets[i][5];

        // remove it from the old if possible
        if (old != undefined && !old.isDisposed()) {
          this.__removeTargetFrom(targetObject, targetProperty, sourceProperty, old);
        }

        // add it to the new if available
        if (value != undefined) {
          this.__addTarget(
            targetObject, targetProperty, sourceProperty, bidirectional,
            options, reverseOptions
          );
        } else {
          // in shutdown situations, it may be that something is already
          // disposed [BUG #4343]
          if (targetObject.isDisposed() || qx.core.ObjectRegistry.inShutDown) {
            continue;
          }
          // if the model is null, reset the current target
          if (targetProperty.indexOf("[") == -1) {
            targetObject["reset" + qx.lang.String.firstUp(targetProperty)]();
          } else {
            var open = targetProperty.indexOf("[");
            var index = parseInt(
              targetProperty.substring(open + 1, targetProperty.length - 1), 10
            );
            targetProperty = targetProperty.substring(0, open);
            var targetArray = targetObject["get" + qx.lang.String.firstUp(targetProperty)]();
            if (index == "last") {
              index = targetArray.length;
            }
            if (targetArray) {
              targetArray.setItem(index, null);
            }
          }
        }
      }
    },


    /**
     * Adds a new target to the controller. After adding the target, the given
     * property of the model will be bound to the targets property.
     *
     * @param targetObject {qx.core.Object} The object on which the property
     *   should be bound.
     *
     * @param targetProperty {String} The property to which the binding should
     *   go.
     *
     * @param sourceProperty {String} The name of the property in the model.
     *
     * @param bidirectional {Boolean?false} Signals if the binding should also work
     *   in the reverse direction, from the target to source.
     *
     * @param options {Map?null} The options Map used by the binding from source
     *   to target. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     *
     * @param reverseOptions {Map?null} The options used by the binding in the
     *   reverse direction. The possible options can be found in the
     *   {@link qx.data.SingleValueBinding} class.
     */
    addTarget: function(
      targetObject, targetProperty, sourceProperty,
      bidirectional, options, reverseOptions
    ) {

      // store the added target
      this.__targets.push([
        targetObject, targetProperty, sourceProperty,
        bidirectional, options, reverseOptions
      ]);

      // delegate the adding
      this.__addTarget(
        targetObject, targetProperty, sourceProperty,
        bidirectional, options, reverseOptions
      );
    },


    /**
    * Does the work for {@link #addTarget} but without saving the target
    * to the internal target registry.
    *
    * @param targetObject {qx.core.Object} The object on which the property
    *   should be bound.
    *
    * @param targetProperty {String} The property to which the binding should
    *   go.
    *
    * @param sourceProperty {String} The name of the property in the model.
    *
    * @param bidirectional {Boolean?false} Signals if the binding should also work
    *   in the reverse direction, from the target to source.
    *
    * @param options {Map?null} The options Map used by the binding from source
    *   to target. The possible options can be found in the
    *   {@link qx.data.SingleValueBinding} class.
    *
    * @param reverseOptions {Map?null} The options used by the binding in the
    *   reverse direction. The possible options can be found in the
    *   {@link qx.data.SingleValueBinding} class.
    */
    __addTarget: function(
      targetObject, targetProperty, sourceProperty,
      bidirectional, options, reverseOptions
    ) {

      // do nothing if no model is set
      if (this.getModel() == null) {
        return;
      }

      // create the binding
      var id = this.getModel().bind(
        sourceProperty, targetObject, targetProperty, options
      );
      // create the reverse binding if necessary
      var idReverse = null
      if (bidirectional) {
        idReverse = targetObject.bind(
          targetProperty, this.getModel(), sourceProperty, reverseOptions
        );
      }

      // save the binding
      var targetHash = targetObject.toHashCode();
      if (this.__bindings[targetHash] == undefined) {
        this.__bindings[targetHash] = [];
      }
      this.__bindings[targetHash].push(
        [id, idReverse, targetProperty, sourceProperty, options, reverseOptions]
      );
    },

    /**
     * Removes the target identified by the three properties.
     *
     * @param targetObject {qx.core.Object} The target object on which the
     *   binding exist.
     *
     * @param targetProperty {String} The targets property name used by the
     *   adding of the target.
     *
     * @param sourceProperty {String} The name of the property of the model.
     */
    removeTarget: function(targetObject, targetProperty, sourceProperty) {
      this.__removeTargetFrom(
        targetObject, targetProperty, sourceProperty, this.getModel()
      );

      // delete the target in the targets reference
      for (var i = 0; i < this.__targets.length; i++) {
        if (
          this.__targets[i][0] == targetObject
          && this.__targets[i][1] == targetProperty
          && this.__targets[i][2] == sourceProperty
        ) {
          this.__targets.splice(i, 1);
        }
      }
    },


    /**
     * Does the work for {@link #removeTarget} but without removing the target
     * from the internal registry.
     *
     * @param targetObject {qx.core.Object} The target object on which the
     *   binding exist.
     *
     * @param targetProperty {String} The targets property name used by the
     *   adding of the target.
     *
     * @param sourceProperty {String} The name of the property of the model.
     *
     * @param sourceObject {String} The source object from which the binding
     *   comes.
     */
    __removeTargetFrom: function(
      targetObject, targetProperty, sourceProperty, sourceObject
    ) {
      // check for not fitting targetObjects
      if (!(targetObject instanceof qx.core.Object)) {
        // just do nothing
        return;
      }

      var currentListing = this.__bindings[targetObject.toHashCode()];
      // if no binding is stored
      if (currentListing == undefined || currentListing.length == 0) {
        return;
      }

      // go threw all listings for the object
      for (var i = 0; i < currentListing.length; i++) {
        // if it is the listing
        if (
          currentListing[i][2] == targetProperty &&
          currentListing[i][3] == sourceProperty
        ) {
          // remove the binding
          var id = currentListing[i][0];
          sourceObject.removeBinding(id);
          // check for the reverse binding
          if (currentListing[i][1] != null) {
            targetObject.removeBinding(currentListing[i][1]);
          }
          // delete the entry and return
          currentListing.splice(i, 1);
          return;
        }
      }
    }
  },


  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    // set the model to null to get the bindings removed
    if (this.getModel() != null && !this.getModel().isDisposed()) {
      this.setModel(null);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This validation manager is responsible for validation of forms.
 */
qx.Class.define("qx.ui.form.validation.Manager",
{
  extend : qx.core.Object,

  construct : function()
  {
    this.base(arguments);

    // storage for all form items
    this.__formItems = [];
    // storage for all results of async validation calls
    this.__asyncResults = {};
    // set the default required field message
    this.setRequiredFieldMessage(qx.locale.Manager.tr("This field is required"));
  },


  events :
  {
    /**
     * Change event for the valid state.
     */
    "changeValid" : "qx.event.type.Data",

    /**
     * Signals that the validation is done. This is not needed on synchronous
     * validation (validation is done right after the call) but very important
     * in the case an asynchronous validator will be used.
     */
    "complete" : "qx.event.type.Event"
  },


  properties :
  {
    /**
     * {Function | AsyncValidator}
     * The validator of the form itself. You can set a function (for
     * synchronous validation) or a {@link qx.ui.form.validation.AsyncValidator}.
     * In both cases, the function can have all added form items as first
     * argument and the manager as a second argument. The manager should be used
     * to set the {@link #invalidMessage}.
     *
     * Keep in mind that the validator is optional if you don't need the
     * validation in the context of the whole form.
     */
    validator :
    {
      check : "value instanceof Function || qx.Class.isSubClassOf(value.constructor, qx.ui.form.validation.AsyncValidator)",
      init : null,
      nullable : true
    },

    /**
     * The invalid message should store the message why the form validation
     * failed. It will be added to the array returned by
     * {@link #getInvalidMessages}.
     */
    invalidMessage :
    {
      check : "String",
      init: ""
    },


    /**
     * This message will be shown if a required field is empty and no individual
     * {@link qx.ui.form.MForm#requiredInvalidMessage} is given.
     */
    requiredFieldMessage :
    {
      check : "String",
      init : ""
    },


    /**
     * The context for the form validation.
     */
    context :
    {
      nullable : true
    }
  },


  members :
  {
    __formItems : null,
    __valid : null,
    __asyncResults : null,
    __syncValid : null,


    /**
     * Add a form item to the validation manager.
     *
     * The form item has to implement at least two interfaces:
     * <ol>
     *   <li>The {@link qx.ui.form.IForm} Interface</li>
     *   <li>One of the following interfaces:
     *     <ul>
     *       <li>{@link qx.ui.form.IBooleanForm}</li>
     *       <li>{@link qx.ui.form.IColorForm}</li>
     *       <li>{@link qx.ui.form.IDateForm}</li>
     *       <li>{@link qx.ui.form.INumberForm}</li>
     *       <li>{@link qx.ui.form.IStringForm}</li>
     *     </ul>
     *   </li>
     * </ol>
     * The validator can be a synchronous or asynchronous validator. In
     * both cases the validator can either returns a boolean or fire an
     * {@link qx.core.ValidationError}. For synchronous validation, a plain
     * JavaScript function should be used. For all asynchronous validations,
     * a {@link qx.ui.form.validation.AsyncValidator} is needed to wrap the
     * plain function.
     *
     * @param formItem {qx.ui.core.Widget} The form item to add.
     * @param validator {Function | qx.ui.form.validation.AsyncValidator}
     *   The validator.
     * @param context {var?null} The context of the validator.
     */
    add: function(formItem, validator, context) {
      // check for the form API
      if (!this.__supportsInvalid(formItem)) {
        throw new Error("Added widget not supported.");
      }
      // check for the data type
      if (this.__supportsSingleSelection(formItem) && !formItem.getValue) {
        // check for a validator
        if (validator != null) {
          throw new Error("Widgets supporting selection can only be validated " +
          "in the form validator");
        }
      }
      var dataEntry =
      {
        item : formItem,
        validator : validator,
        valid : null,
        context : context
      };
      this.__formItems.push(dataEntry);
    },


    /**
     * Remove a form item from the validation manager.
     *
     * @param formItem {qx.ui.core.Widget} The form item to remove.
     * @return {qx.ui.core.Widget?null} The removed form item or
     *  <code>null</code> if the item could not be found.
     */
    remove : function(formItem)
    {
      var items = this.__formItems;

      for (var i = 0, len = items.length; i < len; i++)
      {
        if (formItem === items[i].item)
        {
          items.splice(i, 1);
          return formItem;
        }
      }

      return null;
    },


    /**
     * Returns registered form items from the validation manager.
     *
     * @return {Array} The form items which will be validated.
     */
    getItems : function()
    {
      var items = [];
      for (var i=0; i < this.__formItems.length; i++) {
        items.push(this.__formItems[i].item);
      };
      return items;
    },


    /**
     * Invokes the validation. If only synchronous validators are set, the
     * result of the whole validation is available at the end of the method
     * and can be returned. If an asynchronous validator is set, the result
     * is still unknown at the end of this method so nothing will be returned.
     * In both cases, a {@link #complete} event will be fired if the validation
     * has ended. The result of the validation can then be accessed with the
     * {@link #getValid} method.
     *
     * @return {Boolean|undefined} The validation result, if available.
     */
    validate : function() {
      var valid = true;
      this.__syncValid = true; // collaboration of all synchronous validations
      var items = [];

      // check all validators for the added form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        var validator = this.__formItems[i].validator;

        // store the items in case of form validation
        items.push(formItem);

        // ignore all form items without a validator
        if (validator == null) {
          // check for the required property
          var validatorResult = this.__validateRequired(formItem);
          valid = valid && validatorResult;
          this.__syncValid = validatorResult && this.__syncValid;
          continue;
        }

        var validatorResult = this.__validateItem(
          this.__formItems[i], formItem.getValue()
        );
        // keep that order to ensure that null is returned on async cases
        valid = validatorResult && valid;
        if (validatorResult != null) {
          this.__syncValid = validatorResult && this.__syncValid;
        }
      }

      // check the form validator (be sure to invoke it even if the form
      // items are already false, so keep the order!)
      var formValid = this.__validateForm(items);
      if (qx.lang.Type.isBoolean(formValid)) {
        this.__syncValid = formValid && this.__syncValid;
      }
      valid = formValid && valid;

      this.__setValid(valid);

      if (qx.lang.Object.isEmpty(this.__asyncResults)) {
        this.fireEvent("complete");
      }
      return valid;
    },


    /**
     * Checks if the form item is required. If so, the value is checked
     * and the result will be returned. If the form item is not required, true
     * will be returned.
     *
     * @param formItem {qx.ui.core.Widget} The form item to check.
     * @return {var} Validation result
     */
    __validateRequired : function(formItem) {
      if (formItem.getRequired()) {
        // if its a widget supporting the selection
        if (this.__supportsSingleSelection(formItem)) {
          var validatorResult = !!formItem.getSelection()[0];
        // otherwise, a value should be supplied
        } else {
          var validatorResult = !!formItem.getValue();
        }
        formItem.setValid(validatorResult);
        var individualMessage = formItem.getRequiredInvalidMessage();
        var message = individualMessage ? individualMessage : this.getRequiredFieldMessage();
        formItem.setInvalidMessage(message);
        return validatorResult;
      }
      return true;
    },


    /**
     * Validates a form item. This method handles the differences of
     * synchronous and asynchronous validation and returns the result of the
     * validation if possible (synchronous cases). If the validation is
     * asynchronous, null will be returned.
     *
     * @param dataEntry {Object} The map stored in {@link #add}
     * @param value {var} The currently set value
     * @return {Boolean|null} Validation result or <code>null</code> for async
     * validation
     */
    __validateItem : function(dataEntry, value) {
      var formItem = dataEntry.item;
      var context = dataEntry.context;
      var validator = dataEntry.validator;

      // check for asynchronous validation
      if (this.__isAsyncValidator(validator)) {
        // used to check if all async validations are done
        this.__asyncResults[formItem.toHashCode()] = null;
        validator.validate(formItem, formItem.getValue(), this, context);
        return null;
      }

      var validatorResult = null;

      try {
        var validatorResult = validator.call(context || this, value, formItem);
        if (validatorResult === undefined) {
          validatorResult = true;
        }

      } catch (e) {
        if (e instanceof qx.core.ValidationError) {
          validatorResult = false;
          if (e.message && e.message != qx.type.BaseError.DEFAULTMESSAGE) {
            var invalidMessage = e.message;
          } else {
            var invalidMessage = e.getComment();
          }
          formItem.setInvalidMessage(invalidMessage);
        } else {
          throw e;
        }
      }

      formItem.setValid(validatorResult);
      dataEntry.valid = validatorResult;

      return validatorResult;
    },


    /**
     * Validates the form. It checks for asynchronous validation and handles
     * the differences to synchronous validation. If no form validator is given,
     * true will be returned. If a synchronous validator is given, the
     * validation result will be returned. In asynchronous cases, null will be
     * returned cause the result is not available.
     *
     * @param items {qx.ui.core.Widget[]} An array of all form items.
     * @return {Boolean|null} description
     */
    __validateForm: function(items) {
      var formValidator = this.getValidator();
      var context = this.getContext() || this;

      if (formValidator == null) {
        return true;
      }

      // reset the invalidMessage
      this.setInvalidMessage("");

      if (this.__isAsyncValidator(formValidator)) {
        this.__asyncResults[this.toHashCode()] = null;
        formValidator.validateForm(items, this, context);
        return null;
      }

      try {
        var formValid = formValidator.call(context, items, this);
        if (formValid === undefined) {
          formValid = true;
        }
      } catch (e) {
        if (e instanceof qx.core.ValidationError) {
          formValid = false;

          if (e.message && e.message != qx.type.BaseError.DEFAULTMESSAGE) {
            var invalidMessage = e.message;
          } else {
            var invalidMessage = e.getComment();
          }
          this.setInvalidMessage(invalidMessage);
        } else {
          throw e;
        }
      }
      return formValid;
    },


    /**
     * Helper function which checks, if the given validator is synchronous
     * or asynchronous.
     *
     * @param validator {Function|qx.ui.form.validation.AsyncValidator}
     *   The validator to check.
     * @return {Boolean} True, if the given validator is asynchronous.
     */
    __isAsyncValidator : function(validator) {
      var async = false;
      if (!qx.lang.Type.isFunction(validator)) {
        async = qx.Class.isSubClassOf(
          validator.constructor, qx.ui.form.validation.AsyncValidator
        );
      }
      return async;
    },


    /**
     * Returns true, if the given item implements the {@link qx.ui.form.IForm}
     * interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsInvalid : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.form.IForm);
    },


    /**
     * Returns true, if the given item implements the
     * {@link qx.ui.core.ISingleSelection} interface.
     *
     * @param formItem {qx.core.Object} The item to check.
     * @return {Boolean} true, if the given item implements the
     *   necessary interface.
     */
    __supportsSingleSelection : function(formItem) {
      var clazz = formItem.constructor;
      return qx.Class.hasInterface(clazz, qx.ui.core.ISingleSelection);
    },


    /**
     * Internal setter for the valid member. It generates the event if
     * necessary and stores the new value
     *
     * @param value {Boolean|null} The new valid value of the manager.
     */
    __setValid: function(value) {
      var oldValue = this.__valid;
      this.__valid = value;
      // check for the change event
      if (oldValue != value) {
        this.fireDataEvent("changeValid", value, oldValue);
      }
    },


    /**
     * Returns the valid state of the manager.
     *
     * @return {Boolean|null} The valid state of the manager.
     */
    getValid: function() {
      return this.__valid;
    },


    /**
     * Returns the valid state of the manager.
     *
     * @return {Boolean|null} The valid state of the manager.
     */
    isValid: function() {
      return this.getValid();
    },


    /**
     * Returns an array of all invalid messages of the invalid form items and
     * the form manager itself.
     *
     * @return {String[]} All invalid messages.
     */
    getInvalidMessages: function() {
      var messages = [];
      // combine the messages of all form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        if (!formItem.getValid()) {
          messages.push(formItem.getInvalidMessage());
        }
      }
      // add the forms fail message
      if (this.getInvalidMessage() != "") {
        messages.push(this.getInvalidMessage());
      }

      return messages;
    },


    /**
     * Selects invalid form items
     *
     * @return {Array} invalid form items
     */
    getInvalidFormItems : function() {
      var res = [];
      for (var i = 0; i < this.__formItems.length; i++) {
        var formItem = this.__formItems[i].item;
        if (!formItem.getValid()) {
          res.push(formItem);
        }
      }

      return res;
    },


    /**
     * Resets the validator.
     */
    reset: function() {
      // reset all form items
      for (var i = 0; i < this.__formItems.length; i++) {
        var dataEntry = this.__formItems[i];
        // set the field to valid
        dataEntry.item.setValid(true);
      }
      // set the manager to its initial valid value
      this.__valid = null;
    },


    /**
     * Internal helper method to set the given item to valid for asynchronous
     * validation calls. This indirection is used to determinate if the
     * validation process is completed or if other asynchronous validators
     * are still validating. {@link #__checkValidationComplete} checks if the
     * validation is complete and will be called at the end of this method.
     *
     * @param formItem {qx.ui.core.Widget} The form item to set the valid state.
     * @param valid {Boolean} The valid state for the form item.
     *
     * @internal
     */
    setItemValid: function(formItem, valid) {
      // store the result
      this.__asyncResults[formItem.toHashCode()] = valid;
      formItem.setValid(valid);
      this.__checkValidationComplete();
    },


    /**
     * Internal helper method to set the form manager to valid for asynchronous
     * validation calls. This indirection is used to determinate if the
     * validation process is completed or if other asynchronous validators
     * are still validating. {@link #__checkValidationComplete} checks if the
     * validation is complete and will be called at the end of this method.
     *
     * @param valid {Boolean} The valid state for the form manager.
     *
     * @internal
     */
    setFormValid : function(valid) {
      this.__asyncResults[this.toHashCode()] = valid;
      this.__checkValidationComplete();
    },


    /**
     * Checks if all asynchronous validators have validated so the result
     * is final and the {@link #complete} event can be fired. If that's not
     * the case, nothing will happen in the method.
     */
    __checkValidationComplete : function() {
      var valid = this.__syncValid;

      // check if all async validators are done
      for (var hash in this.__asyncResults) {
        var currentResult = this.__asyncResults[hash];
        valid = currentResult && valid;
        // the validation is not done so just do nothing
        if (currentResult == null) {
          return;
        }
      }
      // set the actual valid state of the manager
      this.__setValid(valid);
      // reset the results
      this.__asyncResults = {};
      // fire the complete event (no entry in the results with null)
      this.fireEvent("complete");
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    this.__formItems = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This class is responsible for validation in all asynchronous cases and
 * should always be used with {@link qx.ui.form.validation.Manager}.
 *
 *
 * It acts like a wrapper for asynchronous validation functions. These
 * validation function must be set in the constructor. The form manager will
 * invoke the validation and the validator function will be called with two
 * arguments:
 * <ul>
 *  <li>asyncValidator: A reference to the corresponding validator.</li>
 *  <li>value: The value of the assigned input field.</li>
 * </ul>
 * These two parameters are needed to set the validation status of the current
 * validator. {@link #setValid} is responsible for doing that.
 *
 *
 * *Warning:* Instances of this class can only be used with one input
 * field at a time. Multi usage is not supported!
 *
 * *Warning:* Calling {@link #setValid} synchronously does not work. If you
 * have an synchronous validator, please check
 * {@link qx.ui.form.validation.Manager#add}. If you have both cases, you have
 * to wrap the synchronous call in a timeout to make it asychronous.
 */
qx.Class.define("qx.ui.form.validation.AsyncValidator",
{
  extend : qx.core.Object,

  /**
   * @param validator {Function} The validator function, which has to be
   *   asynchronous.
   */
  construct : function(validator)
  {
    this.base(arguments);
    // save the validator function
    this.__validatorFunction = validator;
  },

  members :
  {
    __validatorFunction : null,
    __item : null,
    __manager : null,
    __usedForForm : null,

    /**
     * The validate function should only be called by
     * {@link qx.ui.form.validation.Manager}.
     *
     * It stores the given information and calls the validation function set in
     * the constructor. The method is used for form fields only. Validating a
     * form itself will be invokes with {@link #validateForm}.
     *
     * @param item {qx.ui.core.Widget} The form item which should be validated.
     * @param value {var} The value of the form item.
     * @param manager {qx.ui.form.validation.Manager} A reference to the form
     *   manager.
     * @param context {var?null} The context of the validator.
     *
     * @internal
     */
    validate: function(item, value, manager, context) {
      // mark as item validator
      this.__usedForForm = false;
      // store the item and the manager
      this.__item = item;
      this.__manager = manager;
      // invoke the user set validator function
      this.__validatorFunction.call(context || this, this, value);
    },


    /**
     * The validateForm function should only be called by
     * {@link qx.ui.form.validation.Manager}.
     *
     * It stores the given information and calls the validation function set in
     * the constructor. The method is used for forms only. Validating a
     * form item will be invokes with {@link #validate}.
     *
     * @param items {qx.ui.core.Widget[]} All form items of the form manager.
     * @param manager {qx.ui.form.validation.Manager} A reference to the form
     *   manager.
     * @param context {var?null} The context of the validator.
     *
     * @internal
     */
    validateForm : function(items, manager, context) {
      this.__usedForForm = true;
      this.__manager = manager;
      this.__validatorFunction.call(context, items, this);
    },


    /**
     * This method should be called within the asynchronous callback to tell the
     * validator the result of the validation.
     *
     * @param valid {Boolean} The boolean state of the validation.
     * @param message {String?} The invalidMessage of the validation.
     */
    setValid: function(valid, message) {
      // valid processing
      if (this.__usedForForm) {
        // message processing
        if (message !== undefined) {
          this.__manager.setInvalidMessage(message);
        }
        this.__manager.setFormValid(valid);
      } else {
        // message processing
        if (message !== undefined) {
          this.__item.setInvalidMessage(message);
        }
        this.__manager.setItemValid(this.__item, valid);
      }
    }
  },


  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__manager = this.__item = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Each object, which should support single selection have to
 * implement this interface.
 */
qx.Interface.define("qx.ui.core.ISingleSelection",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */


  events :
  {
    /** Fires after the selection was modified */
    "changeSelection" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {qx.ui.core.Widget[]} List of items.
     */
    getSelection : function() {
      return true;
    },

    /**
     * Replaces current selection with the given items.
     *
     * @param items {qx.ui.core.Widget[]} Items to select.
     * @throws {Error} if the item is not a child element.
     */
    setSelection : function(items) {
      return arguments.length == 1;
    },

    /**
     * Clears the whole selection at once.
     */
    resetSelection : function() {
      return true;
    },

    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {qx.ui.core.Widget} Any valid selectable item
     * @return {Boolean} Whether the item is selected.
     * @throws {Error} if the item is not a child element.
     */
    isSelected : function(item) {
      return arguments.length == 1;
    },

    /**
     * Whether the selection is empty.
     *
     * @return {Boolean} Whether the selection is empty.
     */
    isSelectionEmpty : function() {
      return true;
    },

    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables: function(all) {
      return arguments.length == 1;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A horizontal box layout.
 *
 * The horizontal box layout lays out widgets in a horizontal row, from left
 * to right.
 *
 * *Features*
 *
 * * Minimum and maximum dimensions
 * * Prioritized growing/shrinking (flex)
 * * Margins (with horizontal collapsing)
 * * Auto sizing (ignoring percent values)
 * * Percent widths (not relevant for size hint)
 * * Alignment (child property {@link qx.ui.core.LayoutItem#alignX} is ignored)
 * * Horizontal spacing (collapsed with margins)
 * * Reversed children layout (from last to first)
 * * Vertical children stretching (respecting size hints)
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>flex</strong> <em>(Integer)</em>: The flexibility of a layout item determines how the container
 *   distributes remaining empty space among its children. If items are made
 *   flexible, they can grow or shrink accordingly. Their relative flex values
 *   determine how the items are being resized, i.e. the larger the flex ratio
 *   of two items, the larger the resizing of the first item compared to the
 *   second.
 *
 *   If there is only one flex item in a layout container, its actual flex
 *   value is not relevant. To disallow items to become flexible, set the
 *   flex value to zero.
 * </li>
 * <li><strong>width</strong> <em>(String)</em>: Allows to define a percent
 *   width for the item. The width in percent, if specified, is used instead
 *   of the width defined by the size hint. The minimum and maximum width still
 *   takes care of the element's limits. It has no influence on the layout's
 *   size hint. Percent values are mostly useful for widgets which are sized by
 *   the outer hierarchy.
 * </li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the grid layout.
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.HBox();
 * layout.setSpacing(4); // apply spacing
 *
 * var container = new qx.ui.container.Composite(layout);
 *
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * </pre>
 *
 * *External Documentation*
 *
 * See <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/box.html'>extended documentation</a>
 * and links to demos for this layout.
 *
 */
qx.Class.define("qx.ui.layout.HBox",
{
  extend : qx.ui.layout.Abstract,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param spacing {Integer?0} The spacing between child widgets {@link #spacing}.
   * @param alignX {String?"left"} Horizontal alignment of the whole children
   *     block {@link #alignX}.
   * @param separator {Decorator} A separator to render between the items
   */
  construct : function(spacing, alignX, separator)
  {
    this.base(arguments);

    if (spacing) {
      this.setSpacing(spacing);
    }

    if (alignX) {
      this.setAlignX(alignX);
    }

    if (separator) {
      this.setSeparator(separator);
    }
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Horizontal alignment of the whole children block. The horizontal
     * alignment of the child is completely ignored in HBoxes (
     * {@link qx.ui.core.LayoutItem#alignX}).
     */
    alignX :
    {
      check : [ "left", "center", "right" ],
      init : "left",
      apply : "_applyLayoutChange"
    },


    /**
     * Vertical alignment of each child. Can be overridden through
     * {@link qx.ui.core.LayoutItem#alignY}.
     */
    alignY :
    {
      check : [ "top", "middle", "bottom" ],
      init : "top",
      apply : "_applyLayoutChange"
    },


    /** Horizontal spacing between two children */
    spacing :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    },


    /** Separator lines to use between the objects */
    separator :
    {
      check : "Decorator",
      nullable : true,
      apply : "_applyLayoutChange"
    },


    /** Whether the actual children list should be laid out in reversed order. */
    reversed :
    {
      check : "Boolean",
      init : false,
      apply : "_applyReversed"
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __widths : null,
    __flexs : null,
    __enableFlex : null,
    __children : null,

    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyReversed : function()
    {
      // easiest way is to invalidate the cache
      this._invalidChildrenCache = true;

      // call normal layout change
      this._applyLayoutChange();
    },


    /**
     * Rebuilds caches for flex and percent layout properties
     */
    __rebuildCache : function()
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var enableFlex = false;
      var reuse = this.__widths && this.__widths.length != length && this.__flexs && this.__widths;
      var props;

      // Sparse array (keep old one if lengths has not been modified)
      var widths = reuse ? this.__widths : new Array(length);
      var flexs = reuse ? this.__flexs : new Array(length);

      // Reverse support
      if (this.getReversed()) {
        children = children.concat().reverse();
      }

      // Loop through children to preparse values
      for (var i=0; i<length; i++)
      {
        props = children[i].getLayoutProperties();

        if (props.width != null) {
          widths[i] = parseFloat(props.width) / 100;
        }

        if (props.flex != null)
        {
          flexs[i] = props.flex;
          enableFlex = true;
        } else {
          // reset (in case the index of the children changed: BUG #3131)
          flexs[i] = 0;
        }
      }

      // Store data
      if (!reuse)
      {
        this.__widths = widths;
        this.__flexs = flexs;
      }

      this.__enableFlex = enableFlex
      this.__children = children;

      // Clear invalidation marker
      delete this._invalidChildrenCache;
    },





    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        this.assert(name === "flex" || name === "width", "The property '"+name+"' is not supported by the HBox layout!");

        if (name =="width")
        {
          this.assertMatch(value, qx.ui.layout.Util.PERCENT_VALUE);
        }
        else
        {
          // flex
          this.assertNumber(value);
          this.assert(value >= 0);
        }
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight)
    {
      // Rebuild flex/width caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      // Cache children
      var children = this.__children;
      var length = children.length;
      var util = qx.ui.layout.Util;


      // Compute gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeHorizontalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeHorizontalGaps(children, spacing, true);
      }


      // First run to cache children data and compute allocated width
      var i, child, width, percent;
      var widths = [];
      var allocatedWidth = gaps;

      for (i=0; i<length; i+=1)
      {
        percent = this.__widths[i];

        width = percent != null ?
          Math.floor((availWidth - gaps) * percent) :
          children[i].getSizeHint().width;

        widths.push(width);
        allocatedWidth += width;
      }


      // Flex support (growing/shrinking)
      if (this.__enableFlex && allocatedWidth != availWidth)
      {
        var flexibles = {};
        var flex, offset;

        for (i=0; i<length; i+=1)
        {
          flex = this.__flexs[i];

          if (flex > 0)
          {
            hint = children[i].getSizeHint();

            flexibles[i]=
            {
              min : hint.minWidth,
              value : widths[i],
              max : hint.maxWidth,
              flex : flex
            };
          }
        }

        var result = util.computeFlexOffsets(flexibles, availWidth, allocatedWidth);

        for (i in result)
        {
          offset = result[i].offset;

          widths[i] += offset;
          allocatedWidth += offset;
        }
      }


      // Start with left coordinate
      var left = children[0].getMarginLeft();

      // Alignment support
      if (allocatedWidth < availWidth && this.getAlignX() != "left")
      {
        left = availWidth - allocatedWidth;

        if (this.getAlignX() === "center") {
          left = Math.round(left / 2);
        }
      }


      // Layouting children
      var hint, top, height, width, marginRight, marginTop, marginBottom;
      var spacing = this.getSpacing();

      // Pre configure separators
      this._clearSeparators();

      // Compute separator width
      if (separator)
      {
        var separatorInsets = qx.theme.manager.Decoration.getInstance().resolve(separator).getInsets();
        var separatorWidth = separatorInsets.left + separatorInsets.right;
      }

      // Render children and separators
      for (i=0; i<length; i+=1)
      {
        child = children[i];
        width = widths[i];
        hint = child.getSizeHint();

        marginTop = child.getMarginTop();
        marginBottom = child.getMarginBottom();

        // Find usable height
        height = Math.max(hint.minHeight, Math.min(availHeight-marginTop-marginBottom, hint.maxHeight));

        // Respect vertical alignment
        top = util.computeVerticalAlignOffset(child.getAlignY()||this.getAlignY(), height, availHeight, marginTop, marginBottom);

        // Add collapsed margin
        if (i > 0)
        {
          // Whether a separator has been configured
          if (separator)
          {
            // add margin of last child and spacing
            left += marginRight + spacing;

            // then render the separator at this position
            this._renderSeparator(separator, {
              left : left,
              top : 0,
              width : separatorWidth,
              height : availHeight
            });

            // and finally add the size of the separator, the spacing (again) and the left margin
            left += separatorWidth + spacing + child.getMarginLeft();
          }
          else
          {
            // Support margin collapsing when no separator is defined
            left += util.collapseMargins(spacing, marginRight, child.getMarginLeft());
          }
        }

        // Layout child
        child.renderLayout(left, top, width, height);

        // Add width
        left += width;

        // Remember right margin (for collapsing)
        marginRight = child.getMarginRight();
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      // Rebuild flex/width caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      var util = qx.ui.layout.Util;
      var children = this.__children;

      // Initialize
      var minWidth=0, width=0, percentMinWidth=0;
      var minHeight=0, height=0;
      var child, hint, margin;

      // Iterate over children
      for (var i=0, l=children.length; i<l; i+=1)
      {
        child = children[i];
        hint = child.getSizeHint();

        // Sum up widths
        width += hint.width;

        // Detect if child is shrinkable or has percent width and update minWidth
        var flex = this.__flexs[i];
        var percent = this.__widths[i];
        if (flex) {
          minWidth += hint.minWidth;
        } else if (percent) {
          percentMinWidth = Math.max(percentMinWidth, Math.round(hint.minWidth/percent));
        } else {
          minWidth += hint.width;
        }

        // Build vertical margin sum
        margin = child.getMarginTop() + child.getMarginBottom();

        // Find biggest height
        if ((hint.height+margin) > height) {
          height = hint.height + margin;
        }

        // Find biggest minHeight
        if ((hint.minHeight+margin) > minHeight) {
          minHeight = hint.minHeight + margin;
        }
      }

      minWidth += percentMinWidth;

      // Respect gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeHorizontalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeHorizontalGaps(children, spacing, true);
      }

      // Return hint
      return {
        minWidth : minWidth + gaps,
        width : width + gaps,
        minHeight : minHeight,
        height : height
      };
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__widths = this.__flexs = this.__children = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This mixin is included by all widgets, which support an 'execute' like
 * buttons or menu entries.
 */
qx.Mixin.define("qx.ui.core.MExecutable",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired if the {@link #execute} method is invoked.*/
    "execute" : "qx.event.type.Event"
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * A command called if the {@link #execute} method is called, e.g. on a
     * button click.
     */
    command :
    {
      check : "qx.ui.core.Command",
      apply : "_applyCommand",
      event : "changeCommand",
      nullable : true
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __executableBindingIds : null,
    __semaphore : false,
    __executeListenerId : null,


    /**
     * {Map} Set of properties, which will by synced from the command to the
     *    including widget
     *
     * @lint ignoreReferenceField(_bindableProperties)
     */
    _bindableProperties :
    [
      "enabled",
      "label",
      "icon",
      "toolTipText",
      "value",
      "menu"
    ],


    /**
     * Initiate the execute action.
     */
    execute : function()
    {
      var cmd = this.getCommand();

      if (cmd) {
        if (this.__semaphore) {
          this.__semaphore = false;
        } else {
          this.__semaphore = true;
          cmd.execute(this);
        }
      }

      this.fireEvent("execute");
    },


    /**
     * Handler for the execute event of the command.
     *
     * @param e {qx.event.type.Event} The execute event of the command.
     */
    __onCommandExecute : function(e) {
      if (this.__semaphore) {
        this.__semaphore = false;
        return;
      }
      this.__semaphore = true;
      this.execute();
    },


    // property apply
    _applyCommand : function(value, old)
    {
      // execute forwarding
      if (old != null) {
        old.removeListenerById(this.__executeListenerId);
      }
      if (value != null) {
        this.__executeListenerId = value.addListener(
          "execute", this.__onCommandExecute, this
        );
      }

      // binding stuff
      var ids = this.__executableBindingIds;
      if (ids == null) {
        this.__executableBindingIds = ids = {};
      }

      var selfPropertyValue;
      for (var i = 0; i < this._bindableProperties.length; i++) {
        var property = this._bindableProperties[i];

        // remove the old binding
        if (old != null && !old.isDisposed() && ids[property] != null)
        {
          old.removeBinding(ids[property]);
          ids[property] = null;
        }

        // add the new binding
        if (value != null && qx.Class.hasProperty(this.constructor, property)) {
          // handle the init value (dont sync the initial null)
          var cmdPropertyValue = value.get(property);
          if (cmdPropertyValue == null) {
            selfPropertyValue = this.get(property);
            // check also for themed values [BUG #5906]
            if (selfPropertyValue == null) {
              // update the appearance to make sure every themed property is up to date
              this.syncAppearance();
              selfPropertyValue = qx.util.PropertyUtil.getThemeValue(
                this, property
              );
            }
          } else {
            // Reset the self property value [BUG #4534]
            selfPropertyValue = null;
          }
          // set up the binding
          ids[property] = value.bind(property, this, property);
          // reapply the former value
          if (selfPropertyValue) {
            this.set(property, selfPropertyValue);
          }
        }
      }
    }
  },


  destruct : function() {
    this._applyCommand(null, this.getCommand());
    this.__executableBindingIds = null;
  }
});/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which are executable in some way. This
 * could be a button for example.
 */
qx.Interface.define("qx.ui.form.IExecutable",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the widget is executed. Sets the "data" property of the
     * event to the object that issued the command.
     */
    "execute" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      COMMAND PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Set the command of this executable.
     *
     * @param command {qx.ui.core.Command} The command.
     */
    setCommand : function(command) {
      return arguments.length == 1;
    },


    /**
     * Return the current set command of this executable.
     *
     * @return {qx.ui.core.Command} The current set command.
     */
    getCommand : function() {},


    /**
     * Fire the "execute" event on the command.
     */
    execute: function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A Button widget which supports various states and allows it to be used
 * via the mouse and the keyboard.
 *
 * If the user presses the button by clicking on it, or the <code>Enter</code> or
 * <code>Space</code> keys, the button fires an {@link qx.ui.core.MExecutable#execute} event.
 *
 * If the {@link qx.ui.core.MExecutable#command} property is set, the
 * command is executed as well.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var button = new qx.ui.form.Button("Hello World");
 *
 *   button.addListener("execute", function(e) {
 *     alert("Button was clicked");
 *   }, this);
 *
 *   this.getRoot.add(button);
 * </pre>
 *
 * This example creates a button with the label "Hello World" and attaches an
 * event listener to the {@link #execute} event.
 *
 * *External Documentation*
 *
 * <a href='http://manual.qooxdoo.org/${qxversion}/pages/widget/button.html' target='_blank'>
 * Documentation of this widget in the qooxdoo manual.</a>
 */
qx.Class.define("qx.ui.form.Button",
{
  extend : qx.ui.basic.Atom,
  include : [qx.ui.core.MExecutable],
  implement : [qx.ui.form.IExecutable],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String} label of the atom
   * @param icon {String?null} Icon URL of the atom
   * @param command {qx.ui.core.Command?null} Command instance to connect with
   */
  construct : function(label, icon, command)
  {
    this.base(arguments, label, icon);

    if (command != null) {
      this.setCommand(command);
    }

    // Add listeners
    this.addListener("mouseover", this._onMouseOver);
    this.addListener("mouseout", this._onMouseOut);
    this.addListener("mousedown", this._onMouseDown);
    this.addListener("mouseup", this._onMouseUp);

    this.addListener("keydown", this._onKeyDown);
    this.addListener("keyup", this._onKeyUp);

    // Stop events
    this.addListener("dblclick", this._onStopEvent);
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "button"
    },

    // overridden
    focusable :
    {
      refine : true,
      init : true
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      focused : true,
      hovered : true,
      pressed : true,
      disabled : true
    },


    /*
    ---------------------------------------------------------------------------
      USER API
    ---------------------------------------------------------------------------
    */

    /**
     * Manually press the button
     */
    press : function()
    {
      if (this.hasState("abandoned")) {
        return;
      }

      this.addState("pressed");
    },


    /**
     * Manually release the button
     */
    release : function()
    {
      if (this.hasState("pressed")) {
        this.removeState("pressed");
      }
    },


    /**
     * Completely reset the button (remove all states)
     */
    reset : function()
    {
      this.removeState("pressed");
      this.removeState("abandoned");
      this.removeState("hovered");
    },



    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Listener method for "mouseover" event
     * <ul>
     * <li>Adds state "hovered"</li>
     * <li>Removes "abandoned" and adds "pressed" state (if "abandoned" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onMouseOver : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      if (this.hasState("abandoned"))
      {
        this.removeState("abandoned");
        this.addState("pressed");
      }

      this.addState("hovered");
    },


    /**
     * Listener method for "mouseout" event
     * <ul>
     * <li>Removes "hovered" state</li>
     * <li>Adds "abandoned" and removes "pressed" state (if "pressed" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onMouseOut : function(e)
    {
      if (!this.isEnabled() || e.getTarget() !== this) {
        return;
      }

      this.removeState("hovered");

      if (this.hasState("pressed"))
      {
        this.removeState("pressed");
        this.addState("abandoned");
      }
    },


    /**
     * Listener method for "mousedown" event
     * <ul>
     * <li>Removes "abandoned" state</li>
     * <li>Adds "pressed" state</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onMouseDown : function(e)
    {
      if (!e.isLeftPressed()) {
        return;
      }

      e.stopPropagation();

      // Activate capturing if the button get a mouseout while
      // the button is pressed.
      this.capture();

      this.removeState("abandoned");
      this.addState("pressed");
    },


    /**
     * Listener method for "mouseup" event
     * <ul>
     * <li>Removes "pressed" state (if set)</li>
     * <li>Removes "abandoned" state (if set)</li>
     * <li>Adds "hovered" state (if "abandoned" state is not set)</li>
     *</ul>
     *
     * @param e {Event} Mouse event
     */
    _onMouseUp : function(e)
    {
      this.releaseCapture();

      // We must remove the states before executing the command
      // because in cases were the window lost the focus while
      // executing we get the capture phase back (mouseout).
      var hasPressed = this.hasState("pressed");
      var hasAbandoned = this.hasState("abandoned");

      if (hasPressed) {
        this.removeState("pressed");
      }

      if (hasAbandoned)
      {
        this.removeState("abandoned");
      }
      else
      {
        this.addState("hovered");

        if (hasPressed) {
          this.execute();
        }
      }
      e.stopPropagation();
    },


    /**
     * Listener method for "keydown" event.<br/>
     * Removes "abandoned" and adds "pressed" state
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyDown : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          this.removeState("abandoned");
          this.addState("pressed");
          e.stopPropagation();
      }
    },


    /**
     * Listener method for "keyup" event.<br/>
     * Removes "abandoned" and "pressed" state (if "pressed" state is set)
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyUp : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          if (this.hasState("pressed"))
          {
            this.removeState("abandoned");
            this.removeState("pressed");
            this.execute();
            e.stopPropagation();
          }
      }
    }
  }
});/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin handling the valid and required properties for the form widgets.
 */
qx.Mixin.define("qx.ui.form.MForm",
{

  construct : function()
  {
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener("changeLocale", this.__onChangeLocale, this);
    }
  },


  properties : {

    /**
     * Flag signaling if a widget is valid. If a widget is invalid, an invalid
     * state will be set.
     */
    valid : {
      check : "Boolean",
      init : true,
      apply : "_applyValid",
      event : "changeValid"
    },


    /**
     * Flag signaling if a widget is required.
     */
    required : {
      check : "Boolean",
      init : false,
      event : "changeRequired"
    },


    /**
     * Message which is shown in an invalid tooltip.
     */
    invalidMessage : {
      check : "String",
      init: "",
      event : "changeInvalidMessage"
    },


    /**
     * Message which is shown in an invalid tooltip if the {@link #required} is
     * set to true.
     */
    requiredInvalidMessage : {
      check : "String",
      nullable : true,
      event : "changeInvalidMessage"
    }
  },


  members : {
    // apply method
    _applyValid: function(value, old) {
      value ? this.removeState("invalid") : this.addState("invalid");
    },


    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    __onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e)
      {
        // invalid message
        var invalidMessage = this.getInvalidMessage();
        if (invalidMessage && invalidMessage.translate) {
          this.setInvalidMessage(invalidMessage.translate());
        }
        // required invalid message
        var requiredInvalidMessage = this.getRequiredInvalidMessage();
        if (requiredInvalidMessage && requiredInvalidMessage.translate) {
          this.setRequiredInvalidMessage(requiredInvalidMessage.translate());
        }
      },

      "false" : null
    })
  },


  destruct : function()
  {
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this.__onChangeLocale, this);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This is a basic form field with common functionality for
 * {@link TextArea} and {@link TextField}.
 *
 * On every keystroke the value is synchronized with the
 * value of the textfield. Value changes can be monitored by listening to the
 * {@link #input} or {@link #changeValue} events, respectively.
 */
qx.Class.define("qx.ui.form.AbstractField",
{
  extend : qx.ui.core.Widget,
  implement : [
    qx.ui.form.IStringForm,
    qx.ui.form.IForm
  ],
  include : [
    qx.ui.form.MForm
  ],
  type : "abstract",

  statics : {
    /** Stylesheet needed to style the native placeholder element. */
    __stylesheet : null,


    /**
     * Adds the CSS rules needed to style the native placeholder element.
     */
    __addPlaceholderRules : function() {
      if (this.__stylesheet) {
        return;
      }

      this.__stylesheet = qx.bom.Stylesheet.createElement();

      var colorManager = qx.theme.manager.Color.getInstance();
      var color = colorManager.resolve("text-placeholder");

      if (qx.core.Environment.get("engine.name") == "gecko") {
        var selector = "input:-moz-placeholder, textarea:-moz-placeholder";
        qx.bom.Stylesheet.addRule(this.__stylesheet, selector, "color: " + color + " !important");
      } else if (qx.core.Environment.get("engine.name") == "webkit") {
        selector = "input.qx-placeholder-color::-webkit-input-placeholder, textarea.qx-placeholder-color::-webkit-input-placeholder";
        qx.bom.Stylesheet.addRule(this.__stylesheet, selector, "color: " + color);
      } else if (qx.core.Environment.get("engine.name") == "mshtml") {
        selector = "input.qx-placeholder-color:-ms-input-placeholder, textarea.qx-placeholder-color:-ms-input-placeholder";
        qx.bom.Stylesheet.addRule(this.__stylesheet, selector, "color: " + color + " !important");
      }
    }
  },

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param value {String} initial text value of the input field ({@link #setValue}).
   */
  construct : function(value)
  {
    this.base(arguments);

    // shortcut for placeholder feature detection
    this.__useQxPlaceholder = !qx.core.Environment.get("css.placeholder");

    if (value != null) {
      this.setValue(value);
    }

    this.getContentElement().addListener(
      "change", this._onChangeContent, this
    );

    // use qooxdoo placeholder if no native placeholder is supported
    if (this.__useQxPlaceholder) {
      // assign the placeholder text after the appearance has been applied
      this.addListener("syncAppearance", this._syncPlaceholder, this);
    } else {
      // add rules for native placeholder color
      qx.ui.form.AbstractField.__addPlaceholderRules();
      // add a class to the input to restict the placeholder color
      this.getContentElement().setAttribute("class", "qx-placeholder-color");
    }

    // translation support
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener(
        "changeLocale", this._onChangeLocale, this
      );
    }
  },



  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * The event is fired on every keystroke modifying the value of the field.
     *
     * The method {@link qx.event.type.Data#getData} returns the
     * current value of the text field.
     */
    "input" : "qx.event.type.Data",


    /**
     * The event is fired each time the text field looses focus and the
     * text field values has changed.
     *
     * If you change {@link #liveUpdate} to true, the changeValue event will
     * be fired after every keystroke and not only after every focus loss. In
     * that mode, the changeValue event is equal to the {@link #input} event.
     *
     * The method {@link qx.event.type.Data#getData} returns the
     * current text value of the field.
     */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Alignment of the text
     */
    textAlign :
    {
      check : [ "left", "center", "right" ],
      nullable : true,
      themeable : true,
      apply : "_applyTextAlign"
    },


    /** Whether the field is read only */
    readOnly :
    {
      check : "Boolean",
      apply : "_applyReadOnly",
      event : "changeReadOnly",
      init : false
    },


    // overridden
    selectable :
    {
      refine : true,
      init : true
    },


    // overridden
    focusable :
    {
      refine : true,
      init : true
    },

    /** Maximal number of characters that can be entered in the TextArea. */
    maxLength :
    {
      check : "PositiveInteger",
      init : Infinity
    },

    /**
     * Whether the {@link #changeValue} event should be fired on every key
     * input. If set to true, the changeValue event is equal to the
     * {@link #input} event.
     */
    liveUpdate :
    {
      check : "Boolean",
      init : false
    },

    /**
     * String value which will be shown as a hint if the field is all of:
     * unset, unfocused and enabled. Set to null to not show a placeholder
     * text.
     */
    placeholder :
    {
      check : "String",
      nullable : true,
      apply : "_applyPlaceholder"
    },


    /**
     * RegExp responsible for filtering the value of the textfield. the RegExp
     * gives the range of valid values.
     * The following example only allows digits in the textfield.
     * <pre class='javascript'>field.setFilter(/[0-9]/);</pre>
     */
    filter :
    {
      check : "RegExp",
      nullable : true,
      init : null
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __nullValue : true,
    _placeholder : null,
    __oldValue : null,
    __oldInputValue : null,
    __useQxPlaceholder : true,
    __font : null,
    __webfontListenerId : null,


    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    // overridden
    getFocusElement : function() {
      var el = this.getContentElement();
      if (el) {
        return el;
      }
    },


    /**
     * Creates the input element. Derived classes may override this
     * method, to create different input elements.
     *
     * @return {qx.html.Input} a new input element.
     */
    _createInputElement : function() {
      return new qx.html.Input("text");
    },


    // overridden
    renderLayout : function(left, top, width, height)
    {
      var updateInsets = this._updateInsets;
      var changes = this.base(arguments, left, top, width, height);

      // Directly return if superclass has detected that no
      // changes needs to be applied
      if (!changes) {
        return;
      }

      var inner = changes.size || updateInsets;
      var pixel = "px";

      if (inner || changes.local || changes.margin)
      {
        var insets = this.getInsets();
        var innerWidth = width - insets.left - insets.right;
        var innerHeight = height - insets.top - insets.bottom;
        // ensure that the width and height never get negative
        innerWidth = innerWidth < 0 ? 0 : innerWidth;
        innerHeight = innerHeight < 0 ? 0 : innerHeight;
      }

      var input = this.getContentElement();

      // we don't need to update positions on native placeholders
      if (updateInsets && this.__useQxPlaceholder)
      {
        // render the placeholder
        this.__getPlaceholderElement().setStyles({
          "left": insets.left + pixel,
          "top": insets.top + pixel
        });
      }

      if (inner)
      {
        // we don't need to update dimensions on native placeholders
        if (this.__useQxPlaceholder) {
          this.__getPlaceholderElement().setStyles({
            "width": innerWidth + pixel,
            "height": innerHeight + pixel
          });
        }

        input.setStyles({
          "width": innerWidth + pixel,
          "height": innerHeight + pixel
        });

        this._renderContentElement(innerHeight, input);

      }
    },


    /**
     * Hook into {@link qx.ui.form.AbstractField#renderLayout} method.
     * Called after the contentElement has a width and an innerWidth.
     *
     * Note: This was introduced to fix BUG#1585
     *
     * @param innerHeight {Integer} The inner height of the element.
     * @param element {Element} The element.
     */
    _renderContentElement : function(innerHeight, element) {
      //use it in child classes
    },


    // overridden
    _createContentElement : function()
    {
      // create and add the input element
      var el = this._createInputElement();

      // Apply styles
      el.setStyles(
      {
        "border": "none",
        "padding": 0,
        "margin": 0,
        "display" : "block",
        "background" : "transparent",
        "outline": "none",
        "appearance": "none",
        "position": "absolute",
        "autoComplete": "off"
      });

      // initialize the html input
      el.setSelectable(this.getSelectable());
      el.setEnabled(this.getEnabled());

      // Add listener for input event
      el.addListener("input", this._onHtmlInput, this);

      // Disable HTML5 spell checking
      el.setAttribute("spellcheck", "false");

      // Block resize handle
      el.setStyle("resize", "none");

      // IE8 in standard mode needs some extra love here to receive events.
      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        el.setStyles({
          backgroundImage: "url(" + qx.util.ResourceManager.getInstance().toUri("qx/static/blank.gif") + ")"
        });
      }

      return el;
    },


    // overridden
    _applyEnabled : function(value, old)
    {
      this.base(arguments, value, old);

      this.getContentElement().setEnabled(value);

      if (this.__useQxPlaceholder) {
        if (value) {
          this._showPlaceholder();
        } else {
          this._removePlaceholder();
        }
      } else {
        var input = this.getContentElement();
        // remove the placeholder on disabled input elements
        input.setAttribute("placeholder", value ? this.getPlaceholder() : "");
      }
    },


    // default text sizes
    /**
     * @lint ignoreReferenceField(__textSize)
     */
    __textSize :
    {
      width : 16,
      height : 16
    },


    // overridden
    _getContentHint : function()
    {
      return {
        width : this.__textSize.width * 10,
        height : this.__textSize.height || 16
      };
    },


    // overridden
    _applyFont : function(value, old)
    {
      if (old && this.__font && this.__webfontListenerId) {
        this.__font.removeListenerById(this.__webfontListenerId);
        this.__webfontListenerId = null;
      }

      // Apply
      var styles;
      if (value)
      {
        this.__font = qx.theme.manager.Font.getInstance().resolve(value);
        if (this.__font instanceof qx.bom.webfonts.WebFont) {
          this.__webfontListenerId = this.__font.addListener("changeStatus", this._onWebFontStatusChange, this);
        }
        styles = this.__font.getStyles();
      }
      else
      {
        styles = qx.bom.Font.getDefaultStyles();
      }

      // check if text color already set - if so this local value has higher priority
      if (this.getTextColor() != null) {
        delete styles["color"];
      }

      // apply the font to the content element
      this.getContentElement().setStyles(styles);

      // the font will adjust automatically on native placeholders
      if (this.__useQxPlaceholder) {
        // don't apply the color to the placeholder
        delete styles["color"];
        // apply the font to the placeholder
        this.__getPlaceholderElement().setStyles(styles);
      }

      // Compute text size
      if (value) {
        this.__textSize = qx.bom.Label.getTextSize("A", styles);
      } else {
        delete this.__textSize;
      }

      // Update layout
      qx.ui.core.queue.Layout.add(this);
    },


    // overridden
    _applyTextColor : function(value, old)
    {
      if (value) {
        this.getContentElement().setStyle(
          "color", qx.theme.manager.Color.getInstance().resolve(value)
        );
      } else {
        this.getContentElement().removeStyle("color");
      }
    },


    // overridden
    tabFocus : function()
    {
      this.base(arguments);

      this.selectAllText();
    },

    /**
     * Returns the text size.
     * @return {Map} The text size.
     */
    _getTextSize : function() {
      return this.__textSize;
    },

    /*
    ---------------------------------------------------------------------------
      EVENTS
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for native input events. Redirects the event
     * to the widget. Also checks for the filter and max length.
     *
     * @param e {qx.event.type.Data} Input event
     */
    _onHtmlInput : function(e)
    {
      var value = e.getData();
      var fireEvents = true;

      this.__nullValue = false;

      // value unchanged; Firefox fires "input" when pressing ESC [BUG #5309]
      if (this.__oldInputValue && this.__oldInputValue === value) {
        fireEvents = false;
      }

      // check for the filter
      if (this.getFilter() != null)
      {
        var filteredValue = "";
        var index = value.search(this.getFilter());
        var processedValue = value;
        while(index >= 0)
        {
          filteredValue = filteredValue + (processedValue.charAt(index));
          processedValue = processedValue.substring(index + 1, processedValue.length);
          index = processedValue.search(this.getFilter());
        }

        if (filteredValue != value)
        {
          fireEvents = false;
          value = filteredValue;
          this.getContentElement().setValue(value);
        }
      }

      // check for the max length
      if (value.length > this.getMaxLength())
      {
        fireEvents = false;
        this.getContentElement().setValue(
          value.substr(0, this.getMaxLength())
        );
      }

      // fire the events, if necessary
      if (fireEvents)
      {
        // store the old input value
        this.fireDataEvent("input", value, this.__oldInputValue);
        this.__oldInputValue = value;

        // check for the live change event
        if (this.getLiveUpdate()) {
          this.__fireChangeValueEvent(value);
        }
      }
    },

    /**
     * Triggers text size recalculation after a web font was loaded
     *
     * @param ev {qx.event.type.Data} "changeStatus" event
     */
    _onWebFontStatusChange : function(ev)
    {
      if (ev.getData().valid === true) {
        var styles = this.__font.getStyles();
        this.__textSize = qx.bom.Label.getTextSize("A", styles);
        qx.ui.core.queue.Layout.add(this);
      }
    },


    /**
     * Handles the firing of the changeValue event including the local cache
     * for sending the old value in the event.
     *
     * @param value {String} The new value.
     */
    __fireChangeValueEvent : function(value) {
      var old = this.__oldValue;
      this.__oldValue = value;
      if (old != value) {
        this.fireNonBubblingEvent(
          "changeValue", qx.event.type.Data, [value, old]
        );
      }
    },


    /*
    ---------------------------------------------------------------------------
      TEXTFIELD VALUE API
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the value of the textfield to the given value.
     *
     * @param value {String} The new value
     */
    setValue : function(value)
    {
      // handle null values
      if (value === null) {
        // just do nothing if null is already set
        if (this.__nullValue) {
          return value;
        }
        value = "";
        this.__nullValue = true;
      } else {
        this.__nullValue = false;
        // native placeholders will be removed by the browser
        if (this.__useQxPlaceholder) {
          this._removePlaceholder();
        }
      }

      if (qx.lang.Type.isString(value))
      {
        var elem = this.getContentElement();
        if (value.length > this.getMaxLength()) {
          value = value.substr(0, this.getMaxLength());
        }
        if (elem.getValue() != value)
        {
          var oldValue = elem.getValue();
          elem.setValue(value);
          var data = this.__nullValue ? null : value;
          this.__oldValue = oldValue;
          this.__fireChangeValueEvent(data);
          // reset the input value on setValue calls [BUG #6892]
          this.__oldInputValue = this.__oldValue;
        }
        // native placeholders will be shown by the browser
        if (this.__useQxPlaceholder) {
          this._showPlaceholder();
        }
        return value;
      }
      throw new Error("Invalid value type: " + value);
    },


    /**
     * Returns the current value of the textfield.
     *
     * @return {String|null} The current value
     */
    getValue : function() {
      var value = this.getContentElement().getValue();
      return this.__nullValue ? null : value;
    },


    /**
     * Resets the value to the default
     */
    resetValue : function() {
      this.setValue(null);
    },


    /**
     * Event listener for change event of content element
     *
     * @param e {qx.event.type.Data} Incoming change event
     */
    _onChangeContent : function(e)
    {
      this.__nullValue = e.getData() === null;
      this.__fireChangeValueEvent(e.getData());
    },


    /*
    ---------------------------------------------------------------------------
      TEXTFIELD SELECTION API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the current selection.
     * This method only works if the widget is already created and
     * added to the document.
     *
     * @return {String|null}
     */
    getTextSelection : function() {
      return this.getContentElement().getTextSelection();
    },


    /**
     * Returns the current selection length.
     * This method only works if the widget is already created and
     * added to the document.
     *
     * @return {Integer|null}
     */
    getTextSelectionLength : function() {
      return this.getContentElement().getTextSelectionLength();
    },


    /**
     * Returns the start of the text selection
     *
     * @return {Integer|null} Start of selection or null if not available
     */
    getTextSelectionStart : function() {
      return this.getContentElement().getTextSelectionStart();
    },


    /**
     * Returns the end of the text selection
     *
     * @return {Integer|null} End of selection or null if not available
     */
    getTextSelectionEnd : function() {
      return this.getContentElement().getTextSelectionEnd();
    },


    /**
     * Set the selection to the given start and end (zero-based).
     * If no end value is given the selection will extend to the
     * end of the textfield's content.
     * This method only works if the widget is already created and
     * added to the document.
     *
     * @param start {Integer} start of the selection (zero-based)
     * @param end {Integer} end of the selection
     */
    setTextSelection : function(start, end) {
      this.getContentElement().setTextSelection(start, end);
    },


    /**
     * Clears the current selection.
     * This method only works if the widget is already created and
     * added to the document.
     *
     */
    clearTextSelection : function() {
      this.getContentElement().clearTextSelection();
    },


    /**
     * Selects the whole content
     *
     */
    selectAllText : function() {
      this.setTextSelection(0);
    },


    /*
    ---------------------------------------------------------------------------
      PLACEHOLDER HELPER
    ---------------------------------------------------------------------------
    */

    /**
     * Helper to show the placeholder text in the field. It checks for all
     * states and possible conditions and shows the placeholder only if allowed.
     */
    _showPlaceholder : function()
    {
      var fieldValue = this.getValue() || "";
      var placeholder = this.getPlaceholder();
      if (
        placeholder != null &&
        fieldValue == "" &&
        !this.hasState("focused") &&
        !this.hasState("disabled")
      )
      {
        if (this.hasState("showingPlaceholder"))
        {
          this._syncPlaceholder();
        }
        else
        {
          // the placeholder will be set as soon as the appearance is applied
          this.addState("showingPlaceholder");
        }
      }
    },


    /**
     * Helper to remove the placeholder. Deletes the placeholder text from the
     * field and removes the state.
     */
    _removePlaceholder: function() {
      if (this.hasState("showingPlaceholder")) {
        this.__getPlaceholderElement().setStyle("visibility", "hidden");
        this.removeState("showingPlaceholder");
      }
    },


    /**
     * Updates the placeholder text with the DOM
     */
    _syncPlaceholder : function ()
    {
      if (this.hasState("showingPlaceholder")) {
        this.__getPlaceholderElement().setStyle("visibility", "visible");
      }
    },


    /**
     * Returns the placeholder label and creates it if necessary.
     */
    __getPlaceholderElement : function()
    {
      if (this._placeholder == null) {
        // create the placeholder
        this._placeholder = new qx.html.Label();
        var colorManager = qx.theme.manager.Color.getInstance();
        this._placeholder.setStyles({
          "visibility" : "hidden",
          "zIndex" : 6,
          "position" : "absolute",
          "color" : colorManager.resolve("text-placeholder"),
          "whiteSpace": "normal" // enable wrap by default
        });

        this.getContainerElement().add(this._placeholder);
      }
      return this._placeholder;
    },


    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    _onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e)
      {
        var content = this.getPlaceholder();
        if (content && content.translate) {
          this.setPlaceholder(content.translate());
        }
      },

      "false" : null
    }),


    // overridden
    _onChangeTheme : function() {
      this.base(arguments);
      if (this._placeholder) {
        // delete the placeholder element because it uses a theme dependent color
        this._placeholder.dispose();
        this._placeholder = null;
      }
      if (!this.__useQxPlaceholder && qx.ui.form.AbstractField.__stylesheet) {
        qx.bom.Stylesheet.removeSheet(qx.ui.form.AbstractField.__stylesheet);
        qx.ui.form.AbstractField.__stylesheet = null;
        qx.ui.form.AbstractField.__addPlaceholderRules();
      }
    },


    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyPlaceholder : function(value, old)
    {
      if (this.__useQxPlaceholder) {
        this.__getPlaceholderElement().setValue(value);
        if (value != null) {
          this.addListener("focusin", this._removePlaceholder, this);
          this.addListener("focusout", this._showPlaceholder, this);
          this._showPlaceholder();
        } else {
          this.removeListener("focusin", this._removePlaceholder, this);
          this.removeListener("focusout", this._showPlaceholder, this);
          this._removePlaceholder();
        }
      } else {
        // only apply if the widget is enabled
        if (this.getEnabled()) {
          this.getContentElement().setAttribute("placeholder", value);
        }
      }
    },


    // property apply
    _applyTextAlign : function(value, old) {
      this.getContentElement().setStyle("textAlign", value);
    },


    // property apply
    _applyReadOnly : function(value, old)
    {
      var element = this.getContentElement();

      element.setAttribute("readOnly", value);

      if (value)
      {
        this.addState("readonly");
        this.setFocusable(false);
      }
      else
      {
        this.removeState("readonly");
        this.setFocusable(true);
      }
    }

  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    this._placeholder = this.__font = null;

    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this._onChangeLocale, this);
    }

    if (this.__font && this.__webfontListenerId) {
      this.__font.removeListenerById(this.__webfontListenerId);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A Input wrap any valid HTML input element and make it accessible
 * through the normalized qooxdoo element interface.
 */
qx.Class.define("qx.html.Input",
{
  extend : qx.html.Element,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param type {String} The type of the input field. Valid values are
   *   <code>text</code>, <code>textarea</code>, <code>select</code>,
   *   <code>checkbox</code>, <code>radio</code>, <code>password</code>,
   *   <code>hidden</code>, <code>submit</code>, <code>image</code>,
   *   <code>file</code>, <code>search</code>, <code>reset</code>,
   *   <code>select</code> and <code>textarea</code>.
   * @param styles {Map?null} optional map of CSS styles, where the key is the name
   *    of the style and the value is the value to use.
   * @param attributes {Map?null} optional map of element attributes, where the
   *    key is the name of the attribute and the value is the value to use.
   */
  construct : function(type, styles, attributes)
  {
    // Update node name correctly
    if (type === "select" || type === "textarea") {
      var nodeName = type;
    } else {
      nodeName = "input";
    }

    this.base(arguments, nodeName, styles, attributes);

    this.__type = type;
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    __type : null,
    // used for webkit only
    __selectable : null,
    __enabled : null,

    /*
    ---------------------------------------------------------------------------
      ELEMENT API
    ---------------------------------------------------------------------------
    */

    //overridden
    _createDomElement : function() {
      return qx.bom.Input.create(this.__type);
    },


    // overridden
    _applyProperty : function(name, value)
    {
      this.base(arguments, name, value);
      var element = this.getDomElement();

      if (name === "value") {
        qx.bom.Input.setValue(element, value);
      } else if (name === "wrap") {
        qx.bom.Input.setWrap(element, value);

        // qx.bom.Input#setWrap has the side-effect that the CSS property
        // overflow is set via DOM methods, causing queue and DOM to get
        // out of sync. Mirror all overflow properties to handle the case
        // when group and x/y property differ.
        this.setStyle("overflow", element.style.overflow, true);
        this.setStyle("overflowX", element.style.overflowX, true);
        this.setStyle("overflowY", element.style.overflowY, true);
      }
    },


    /**
     * Set the input element enabled / disabled.
     * Webkit needs a special treatment because the set color of the input
     * field changes automatically. Therefore, we use
     * <code>-webkit-user-modify: read-only</code> and
     * <code>-webkit-user-select: none</code>
     * for disabling the fields in webkit. All other browsers use the disabled
     * attribute.
     *
     * @param value {Boolean} true, if the inpout element should be enabled.
     */
    setEnabled : qx.core.Environment.select("engine.name",
    {
      "webkit" : function(value)
      {
        this.__enabled = value;

        if (!value) {
          this.setStyles({
            "userModify": "read-only",
            "userSelect": "none"
          });
        } else {
          this.setStyles({
            "userModify": null,
            "userSelect": this.__selectable ? null : "none"
          });
        }
      },

      "default" : function(value)
      {
        this.setAttribute("disabled", value===false);
      }
    }),


    /**
     * Set whether the element is selectable. It uses the qooxdoo attribute
     * qxSelectable with the values 'on' or 'off'.
     * In webkit, a special css property will be used and checks for the
     * enabled state.
     *
     * @param value {Boolean} True, if the element should be selectable.
     */
    setSelectable : qx.core.Environment.select("engine.name",
    {
      "webkit" : function(value)
      {
        this.__selectable = value;

        // Only apply the value when it is enabled
        this.base(arguments, this.__enabled && value);
      },

      "default" : function(value)
      {
        this.base(arguments, value);
      }
    }),



    /*
    ---------------------------------------------------------------------------
      INPUT API
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the value of the input element.
     *
     * @param value {var} the new value
     * @return {qx.html.Input} This instance for for chaining support.
     */
    setValue : function(value)
    {
      var element = this.getDomElement();

      if (element)
      {
        // Do not overwrite when already correct (on input events)
        // This is needed to keep caret position while typing.
        if (element.value != value) {
          qx.bom.Input.setValue(element, value);
        }
      }
      else
      {
        this._setProperty("value", value);
      }

      return this;
    },


    /**
     * Get the current value.
     *
     * @return {String} The element's current value.
     */
    getValue : function()
    {
      var element = this.getDomElement();

      if (element) {
        return qx.bom.Input.getValue(element);
      }

      return this._getProperty("value") || "";
    },


    /**
     * Sets the text wrap behavior of a text area element.
     *
     * This property uses the style property "wrap" (IE) respectively "whiteSpace"
     *
     * @param wrap {Boolean} Whether to turn text wrap on or off.
     * @param direct {Boolean?false} Whether the execution should be made
     *  directly when possible
     * @return {qx.html.Input} This instance for for chaining support.
     */
    setWrap : function(wrap, direct)
    {
      if (this.__type === "textarea") {
        this._setProperty("wrap", wrap, direct);
      } else {
        throw new Error("Text wrapping is only support by textareas!");
      }

      return this;
    },


    /**
     * Gets the text wrap behavior of a text area element.
     *
     * This property uses the style property "wrap" (IE) respectively "whiteSpace"
     *
     * @return {Boolean} Whether wrapping is enabled or disabled.
     */
    getWrap : function()
    {
      if (this.__type === "textarea") {
        return this._getProperty("wrap");
      } else {
        throw new Error("Text wrapping is only support by textareas!");
      }
    }
  }
});/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

   ======================================================================

   This class contains code based on the following work:

   * jQuery
     http://jquery.com
     Version 1.3.1

     Copyright:
       2009 John Resig

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

************************************************************************ */

/* ************************************************************************
#require(qx.lang.Array#contains)
************************************************************************ */

/**
 * Cross browser abstractions to work with input elements.
 */
qx.Bootstrap.define("qx.bom.Input",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Map} Internal data structures with all supported input types */
    __types :
    {
      text : 1,
      textarea : 1,
      select : 1,
      checkbox : 1,
      radio : 1,
      password : 1,
      hidden : 1,
      submit : 1,
      image : 1,
      file : 1,
      search : 1,
      reset : 1,
      button : 1
    },


    /**
     * Creates an DOM input/textarea/select element.
     *
     * Attributes may be given directly with this call. This is critical
     * for some attributes e.g. name, type, ... in many clients.
     *
     * Note: <code>select</code> and <code>textarea</code> elements are created
     * using the identically named <code>type</code>.
     *
     * @param type {String} Any valid type for HTML, <code>select</code>
     *   and <code>textarea</code>
     * @param attributes {Map} Map of attributes to apply
     * @param win {Window} Window to create the element for
     * @return {Element} The created input node
     */
    create : function(type, attributes, win)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertKeyInMap(type, this.__types, "Unsupported input type.");
      }

      // Work on a copy to not modify given attributes map
      var attributes = attributes ? qx.lang.Object.clone(attributes) : {};

      var tag;

      if (type === "textarea" || type === "select")
      {
        tag = type;
      }
      else
      {
        tag = "input";
        attributes.type = type;
      }

      return qx.dom.Element.create(tag, attributes, win);
    },


    /**
     * Applies the given value to the element.
     *
     * Normally the value is given as a string/number value and applied
     * to the field content (textfield, textarea) or used to
     * detect whether the field is checked (checkbox, radiobutton).
     *
     * Supports array values for selectboxes (multiple-selection)
     * and checkboxes or radiobuttons (for convenience).
     *
     * Please note: To modify the value attribute of a checkbox or
     * radiobutton use {@link qx.bom.element.Attribute#set} instead.
     *
     * @param element {Element} element to update
     * @param value {String|Number|Array} the value to apply
     */
    setValue : function(element, value)
    {
      var tag = element.nodeName.toLowerCase();
      var type = element.type;
      var Array = qx.lang.Array;
      var Type = qx.lang.Type;

      if (typeof value === "number") {
        value += "";
      }

      if ((type === "checkbox" || type === "radio"))
      {
        if (Type.isArray(value)) {
          element.checked = Array.contains(value, element.value);
        } else {
          element.checked = element.value == value;
        }
      }
      else if (tag === "select")
      {
        var isArray = Type.isArray(value);
        var options = element.options;
        var subel, subval;

        for (var i=0, l=options.length; i<l; i++)
        {
          subel = options[i];
          subval = subel.getAttribute("value");
          if (subval == null) {
            subval = subel.text;
          }

          subel.selected = isArray ?
             Array.contains(value, subval) : value == subval;
        }

        if (isArray && value.length == 0) {
          element.selectedIndex = -1;
        }
      }
      else if ((type === "text" || type === "textarea") &&
        (qx.core.Environment.get("engine.name") == "mshtml"))
      {
        // These flags are required to detect self-made property-change
        // events during value modification. They are used by the Input
        // event handler to filter events.
        element.$$inValueSet = true;
        element.value = value;
        element.$$inValueSet = null;
      }
      else
      {
        element.value = value;
      }
    },


    /**
     * Returns the currently configured value.
     *
     * Works with simple input fields as well as with
     * select boxes or option elements.
     *
     * Returns an array in cases of multi-selection in
     * select boxes but in all other cases a string.
     *
     * @param element {Element} DOM element to query
     * @return {String|Array} The value of the given element
     */
    getValue : function(element)
    {
      var tag = element.nodeName.toLowerCase();

      if (tag === "option") {
        return (element.attributes.value || {}).specified ? element.value : element.text;
      }

      if (tag === "select")
      {
        var index = element.selectedIndex;

        // Nothing was selected
        if (index < 0) {
          return null;
        }

        var values = [];
        var options = element.options;
        var one = element.type == "select-one";
        var clazz = qx.bom.Input;
        var value;

        // Loop through all the selected options
        for (var i=one ? index : 0, max=one ? index+1 : options.length; i<max; i++)
        {
          var option = options[i];

          if (option.selected)
          {
            // Get the specifc value for the option
            value = clazz.getValue(option);

            // We don't need an array for one selects
            if (one) {
              return value;
            }

            // Multi-Selects return an array
            values.push(value);
          }
        }

        return values;
      }
      else
      {
        return (element.value || "").replace(/\r/g, "");
      }
    },


    /**
     * Sets the text wrap behaviour of a text area element.
     * This property uses the attribute "wrap" respectively
     * the style property "whiteSpace"
     *
     * @signature function(element, wrap)
     * @param element {Element} DOM element to modify
     * @param wrap {Boolean} Whether to turn text wrap on or off.
     */
    setWrap : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element, wrap) {
        var wrapValue = wrap ? "soft" : "off";

        // Explicitly set overflow-y CSS property to auto when wrapped,
        // allowing the vertical scroll-bar to appear if necessary
        var styleValue = wrap ? "auto" : "";

        element.wrap = wrapValue;
        element.style.overflowY = styleValue;
      },

      "gecko|webkit" : function(element, wrap)
      {
        var wrapValue = wrap ? "soft" : "off";
        var styleValue = wrap ? "" : "auto";

        element.setAttribute("wrap", wrapValue);
        element.style.overflow = styleValue;
      },

      "default" : function(element, wrap) {
        element.style.whiteSpace = wrap ? "normal" : "nowrap";
      }
    })
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)
     * Adrian Olaru (adrianolaru)

************************************************************************ */

/**
 * The TextField is a single-line text input field.
 */
qx.Class.define("qx.ui.form.TextField",
{
  extend : qx.ui.form.AbstractField,


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "textfield"
    },

    // overridden
    allowGrowY :
    {
      refine : true,
      init : false
    },

    // overridden
    allowShrinkY :
    {
      refine : true,
      init : false
    }
  },

  members : {

    // overridden
    _renderContentElement : function(innerHeight, element) {
     if ((qx.core.Environment.get("engine.name") == "mshtml") &&
         (parseInt(qx.core.Environment.get("engine.version"), 10) < 9
         || qx.core.Environment.get("browser.documentmode") < 9))
     {
       element.setStyles({
         "line-height" : innerHeight + 'px'
       });
     }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Jonathan Weiß (jonathan_rass)
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * The TextField is a multi-line text input field.
 */
qx.Class.define("qx.ui.form.TextArea",
{
  extend : qx.ui.form.AbstractField,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param value {String?""} The text area's initial value
   */
  construct : function(value)
  {
    this.base(arguments, value);
    this.initWrap();

    this.addListener("mousewheel", this._onMousewheel, this);
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Controls whether text wrap is activated or not. */
    wrap :
    {
      check : "Boolean",
      init : true,
      apply : "_applyWrap"
    },

    // overridden
    appearance :
    {
      refine : true,
      init : "textarea"
    },

    /** Factor for scrolling the <code>TextArea</code> with the mouse wheel. */
    singleStep :
    {
      check : "Integer",
      init : 20
    },

    /** Minimal line height. On default this is set to four lines. */
    minimalLineHeight :
    {
      check : "Integer",
      apply : "_applyMinimalLineHeight",
      init : 4
    },

    /**
    * Whether the <code>TextArea</code> should automatically adjust to
    * the height of the content.
    *
    * To set the initial height, modify {@link #minHeight}. If you wish
    * to set a minHeight below four lines of text, also set
    * {@link #minimalLineHeight}. In order to limit growing to a certain
    * height, set {@link #maxHeight} respectively. Please note that
    * autoSize is ignored when the {@link #height} property is in use.
    */
    autoSize :
    {
      check : "Boolean",
      apply : "_applyAutoSize",
      init : false
    }

  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __areaClone : null,
    __areaHeight : null,
    __originalAreaHeight : null,

    // overridden
    setValue : function(value)
    {
      value = this.base(arguments, value);
      this.__autoSize();

      return value;
    },

    /**
     * Handles the mouse wheel for scrolling the <code>TextArea</code>.
     *
     * @param e {qx.event.type.MouseWheel} mouse wheel event.
     */
    _onMousewheel : function(e) {
      var contentElement = this.getContentElement();
      var scrollY = contentElement.getScrollY();

      contentElement.scrollToY(scrollY + e.getWheelDelta("y") * this.getSingleStep());

      var newScrollY = contentElement.getScrollY();

      if (newScrollY != scrollY) {
        e.stop();
      }
    },

    /*
    ---------------------------------------------------------------------------
      AUTO SIZE
    ---------------------------------------------------------------------------
    */

    /**
    * Adjust height of <code>TextArea</code> so that content fits without scroll bar.
    *
    */
    __autoSize: function() {
      if (this.isAutoSize()) {
        var clone = this.__getAreaClone();

        if (clone) {

          // Remember original area height
          this.__originalAreaHeight = this.__originalAreaHeight || this._getAreaHeight();

          var scrolledHeight = this._getScrolledAreaHeight();

          // Show scoll-bar when above maxHeight, if defined
          if (this.getMaxHeight()) {
            var insets = this.getInsets();
            var innerMaxHeight = -insets.top + this.getMaxHeight() - insets.bottom;
            if (scrolledHeight > innerMaxHeight) {
                this.getContentElement().setStyle("overflowY", "auto");
            } else {
                this.getContentElement().setStyle("overflowY", "hidden");
            }
          }

          // Never shrink below original area height
          var desiredHeight = Math.max(scrolledHeight, this.__originalAreaHeight);

          // Set new height
          this._setAreaHeight(desiredHeight);

        // On init, the clone is not yet present. Try again on appear.
        } else {
          this.getContentElement().addListenerOnce("appear", function() {
            this.__autoSize();
          }, this);
        }
      }
    },

    /**
    * Get actual height of <code>TextArea</code>
    *
    * @return {Integer} Height of <code>TextArea</code>
    */
    _getAreaHeight: function() {
      return this.getInnerSize().height;
    },

    /**
    * Set actual height of <code>TextArea</code>
    *
    * @param height {Integer} Desired height of <code>TextArea</code>
    */
    _setAreaHeight: function(height) {
      if (this._getAreaHeight() !== height) {
        this.__areaHeight = height;
        qx.ui.core.queue.Layout.add(this);

        // Apply height directly. This works-around a visual glitch in WebKit
        // browsers where a line-break causes the text to be moved upwards
        // for one line. Since this change appears instantly whereas the queue
        // is computed later, a flicker is visible.
        qx.ui.core.queue.Manager.flush();

        this.__forceRewrap();
      }
    },

    /**
    * Get scrolled area height. Equals the total height of the <code>TextArea</code>,
    * as if no scroll-bar was visible.
    *
    * @return {Integer} Height of scrolled area
    */
    _getScrolledAreaHeight: function() {
      var clone = this.__getAreaClone();
      var cloneDom = clone.getDomElement();

      if (cloneDom) {

        // Clone created but not yet in DOM. Try again.
        if (!cloneDom.parentNode) {
          qx.html.Element.flush();
          return this._getScrolledAreaHeight();
        }

        // In WebKit, "wrap" must have been "soft" on DOM level before setting
        // "off" can disable wrapping. To fix, make sure wrap is toggled.
        // Otherwise, the height of an auto-size text area with wrapping
        // disabled initially is incorrectly computed as if wrapping was enabled.
        if (qx.core.Environment.get("engine.name") === "webkit") {
          clone.setWrap(!this.getWrap(), true);
        }

        clone.setWrap(this.getWrap(), true);

        // Webkit needs overflow "hidden" in order to correctly compute height
        if (qx.core.Environment.get("engine.name") == "webkit") {
          cloneDom.style.overflow = "hidden";
        }

        // IE >= 8 needs overflow "visible" in order to correctly compute height
        if (qx.core.Environment.get("engine.name") == "mshtml" &&
          qx.core.Environment.get("browser.documentmode") >= 8) {
          cloneDom.style.overflow = "visible";
        }

        // Update value
        clone.setValue(this.getValue());

        // Recompute
        this.__scrollCloneToBottom(clone);

        if (qx.core.Environment.get("engine.name") == "mshtml") {
          // Flush required for scrollTop to return correct value
          // when initial value should be taken into consideration
          if (!cloneDom.scrollTop) {
            qx.html.Element.flush();
          }

          // Compensate for slightly off scroll height in IE
          return cloneDom.scrollTop + this._getTextSize().height;
        }

        return cloneDom.scrollTop;
      }
    },

    /**
    * Returns the area clone.
    *
    * @return {Element|null} DOM Element or <code>null</code> if there is no
    * original element
    */
    __getAreaClone: function() {
      this.__areaClone = this.__areaClone || this.__createAreaClone();
      return this.__areaClone;
    },

    /**
    * Creates and prepares the area clone.
    *
    * @return {Element} Element
    */
    __createAreaClone: function() {
      var orig,
          clone,
          cloneDom,
          cloneHtml;

      orig = this.getContentElement();

      // An existing DOM element is required
      if (!orig.getDomElement()) {
        return null;
      }

      // Create DOM clone
      cloneDom = qx.bom.Element.clone(orig.getDomElement());

      // Convert to qx.html Element
      cloneHtml = new qx.html.Input("textarea");
      cloneHtml.useElement(cloneDom);
      clone = cloneHtml;

      // Push out of view
      // Zero height (i.e. scrolled area equals height)
      clone.setStyles({
        position: "absolute",
        top: 0,
        left: -9999,
        height: 0,
        overflow: "hidden"
      }, true);

      // Fix attributes
      clone.removeAttribute('id');
      clone.removeAttribute('name');
      clone.setAttribute("tabIndex", "-1");

      // Copy value
      clone.setValue(orig.getValue());

      // Attach to DOM
      clone.insertBefore(orig);

      // Make sure scrollTop is actual height
      this.__scrollCloneToBottom(clone);

      return clone;
    },

    /**
    * Scroll <code>TextArea</code> to bottom. That way, scrollTop reflects the height
    * of the <code>TextArea</code>.
    *
    * @param clone {Element} The <code>TextArea</code> to scroll
    */
    __scrollCloneToBottom: function(clone) {
      clone = clone.getDomElement();
      if (clone) {
        clone.scrollTop = 10000;
      }
    },

    /*
    ---------------------------------------------------------------------------
      FIELD API
    ---------------------------------------------------------------------------
    */

    // overridden
    _createInputElement : function()
    {
      return new qx.html.Input("textarea", {
        overflowX: "auto",
        overflowY: "auto"
      });
    },


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyWrap : function(value, old) {
      this.getContentElement().setWrap(value);
      if (this._placeholder) {
        var whiteSpace = value ? "normal" : "nowrap";
        this._placeholder.setStyle("whiteSpace", whiteSpace);
      }
      this.__autoSize();
    },

    // property apply
    _applyMinimalLineHeight : function() {
      qx.ui.core.queue.Layout.add(this);
    },

    // property apply
    _applyAutoSize: function(value, old) {
      if (qx.core.Environment.get("qx.debug")) {
        this.__warnAutoSizeAndHeight();
      }

      if (value) {
        this.__autoSize();
        this.addListener("input", this.__autoSize, this);

        // This is done asynchronously on purpose. The style given would
        // otherwise be overridden by the DOM changes queued in the
        // property apply for wrap. See [BUG #4493] for more details.
        this.addListenerOnce("appear", function() {
          this.getContentElement().setStyle("overflowY", "hidden");
        });

      } else {
        this.removeListener("input", this.__autoSize);
        this.getContentElement().setStyle("overflowY", "auto");
      }

    },

    // property apply
    _applyDimension : function(value) {
      this.base(arguments);

      if (qx.core.Environment.get("qx.debug")) {
        this.__warnAutoSizeAndHeight();
      }

      if (value === this.getMaxHeight()) {
        this.__autoSize();
      }
    },

    /**
     * Force rewrapping of text.
     *
     * The distribution of characters depends on the space available.
     * Unfortunately, browsers do not reliably (or not at all) rewrap text when
     * the size of the text area changes.
     *
     * This method is called on change of the area's size.
     */
    __forceRewrap : function() {
      var content = this.getContentElement();
      var element = content.getDomElement();

      // Temporarily increase width
      var width = content.getStyle("width");
      content.setStyle("width", parseInt(width, 10) + 1000 + "px", true);

      // Force browser to render
      if (element) {
        qx.bom.element.Dimension.getWidth(element);
      }

      // Restore width
      content.setStyle("width", width, true);
    },

    /**
     * Warn when both autoSize and height property are set.
     *
     */
    __warnAutoSizeAndHeight: function() {
      if (this.isAutoSize() && this.getHeight()) {
        this.warn("autoSize is ignored when the height property is set. " +
                  "If you want to set an initial height, use the minHeight " +
                  "property instead.");
      }
    },

    /*
    ---------------------------------------------------------------------------
      LAYOUT
    ---------------------------------------------------------------------------
    */

    // overridden
    _getContentHint : function()
    {
      var hint = this.base(arguments);

      // lines of text
      hint.height = hint.height * this.getMinimalLineHeight();

      // 20 character wide
      hint.width = this._getTextSize().width * 20;

      if (this.isAutoSize()) {
        hint.height = this.__areaHeight || hint.height;
      }

      return hint;
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Each object, which should be managed by a {@link RadioGroup} have to
 * implement this interface.
 */
qx.Interface.define("qx.ui.form.IRadioItem",
{

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the item was checked or unchecked */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Set whether the item is checked
     *
     * @param value {Boolean} whether the item should be checked
     */
    setValue : function(value) {},


    /**
     * Get whether the item is checked
     *
     * @return {Boolean} whether the item it checked
     */
    getValue : function() {},


    /**
     * Set the radiogroup, which manages this item
     *
     * @param value {qx.ui.form.RadioGroup} The radiogroup, which should
     *     manage the item.
     */
    setGroup : function(value) {
      this.assertInstance(value, qx.ui.form.RadioGroup);
    },


    /**
     * Get the radiogroup, which manages this item
     *
     * @return {qx.ui.form.RadioGroup} The radiogroup, which manages the item.
     */
    getGroup : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * This mixin links all methods to manage the single selection.
 *
 * The class which includes the mixin has to implements two methods:
 *
 * <ul>
 * <li><code>_getItems</code>, this method has to return a <code>Array</code>
 *    of <code>qx.ui.core.Widget</code> that should be managed from the manager.
 * </li>
 * <li><code>_isAllowEmptySelection</code>, this method has to return a
 *    <code>Boolean</code> value for allowing empty selection or not.
 * </li>
 * </ul>
 */
qx.Mixin.define("qx.ui.core.MSingleSelectionHandling",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fires after the selection was modified */
    "changeSelection" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** {qx.ui.core.SingleSelectionManager} the single selection manager */
    __manager : null,


    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {qx.ui.core.Widget[]} List of items.
     */
    getSelection : function() {
      var selected = this.__getManager().getSelected();

      if (selected) {
        return [selected];
      } else {
        return [];
      }
    },

    /**
     * Replaces current selection with the given items.
     *
     * @param items {qx.ui.core.Widget[]} Items to select.
     * @throws {Error} if one of the items is not a child element and if
     *    items contains more than one elements.
     */
    setSelection : function(items) {
      switch(items.length)
      {
        case 0:
          this.resetSelection();
          break;
        case 1:
          this.__getManager().setSelected(items[0]);
          break;
        default:
          throw new Error("Could only select one item, but the selection" +
            " array contains " + items.length + " items!");
      }
    },

    /**
     * Clears the whole selection at once.
     */
    resetSelection : function() {
      this.__getManager().resetSelected();
    },

    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {qx.ui.core.Widget} Any valid selectable item.
     * @return {Boolean} Whether the item is selected.
     * @throws {Error} if one of the items is not a child element.
     */
    isSelected : function(item) {
      return this.__getManager().isSelected(item);
    },

    /**
     * Whether the selection is empty.
     *
     * @return {Boolean} Whether the selection is empty.
     */
    isSelectionEmpty : function() {
      return this.__getManager().isSelectionEmpty();
    },


    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables: function(all) {
      return this.__getManager().getSelectables(all);
    },


    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER
    ---------------------------------------------------------------------------
    */


    /**
     * Event listener for <code>changeSelected</code> event on single
     * selection manager.
     *
     * @param e {qx.event.type.Data} Data event.
     */
    _onChangeSelected : function(e) {
      var newValue = e.getData();
      var oldVlaue = e.getOldData();

      newValue == null ? newValue = [] : newValue = [newValue];
      oldVlaue == null ? oldVlaue = [] : oldVlaue = [oldVlaue];

      this.fireDataEvent("changeSelection", newValue, oldVlaue);
    },

    /**
     * Return the selection manager if it is already exists, otherwise creates
     * the manager.
     *
     * @return {qx.ui.core.SingleSelectionManager} Single selection manager.
     */
    __getManager : function()
    {
      if (this.__manager == null)
      {
        var that = this;
        this.__manager = new qx.ui.core.SingleSelectionManager(
        {
          getItems : function() {
            return that._getItems();
          },

          isItemSelectable : function(item) {
            if (that._isItemSelectable) {
              return that._isItemSelectable(item);
            } else {
              return item.isVisible();
            }
          }
        });
        this.__manager.addListener("changeSelected", this._onChangeSelected, this);
      }
      this.__manager.setAllowEmptySelection(this._isAllowEmptySelection());

      return this.__manager;
    }
  },


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  destruct : function() {
    this._disposeObjects("__manager");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * Responsible for the single selection management.
 *
 * The class manage a list of {@link qx.ui.core.Widget} which are returned from
 * {@link qx.ui.core.ISingleSelectionProvider#getItems}.
 *
 * @internal
 */
qx.Class.define("qx.ui.core.SingleSelectionManager",
{
  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  /**
   * Construct the single selection manager.
   *
   * @param selectionProvider {qx.ui.core.ISingleSelectionProvider} The provider
   * for selection.
   */
  construct : function(selectionProvider) {
    this.base(arguments);

    if (qx.core.Environment.get("qx.debug")) {
      qx.core.Assert.assertInterface(selectionProvider,
        qx.ui.core.ISingleSelectionProvider,
        "Invalid selectionProvider!");
    }

    this.__selectionProvider = selectionProvider;
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */


  events :
  {
    /** Fires after the selection was modified */
    "changeSelected" : "qx.event.type.Data"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */


  properties :
  {
    /**
     * If the value is <code>true</code> the manager allows an empty selection,
     * otherwise the first selectable element returned from the
     * <code>qx.ui.core.ISingleSelectionProvider</code> will be selected.
     */
    allowEmptySelection :
    {
      check : "Boolean",
      init : true,
      apply : "__applyAllowEmptySelection"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** {qx.ui.core.Widget} The selected widget. */
    __selected : null,

    /** {qx.ui.core.ISingleSelectionProvider} The provider for selection management */
    __selectionProvider : null,


    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the current selected element.
     *
     * @return {qx.ui.core.Widget | null} The current selected widget or
     *    <code>null</code> if the selection is empty.
     */
    getSelected : function() {
      return this.__selected;
    },

    /**
     * Selects the passed element.
     *
     * @param item {qx.ui.core.Widget} Element to select.
     * @throws {Error} if the element is not a child element.
     */
    setSelected : function(item) {
      if (!this.__isChildElement(item)) {
        throw new Error("Could not select " + item +
          ", because it is not a child element!");
      }

      this.__setSelected(item);
    },

    /**
     * Reset the current selection. If {@link #allowEmptySelection} is set to
     * <code>true</code> the first element will be selected.
     */
    resetSelected : function(){
      this.__setSelected(null);
    },

    /**
     * Return <code>true</code> if the passed element is selected.
     *
     * @param item {qx.ui.core.Widget} Element to check if selected.
     * @return {Boolean} <code>true</code> if passed element is selected,
     *    <code>false</code> otherwise.
     * @throws {Error} if the element is not a child element.
     */
    isSelected : function(item) {
      if (!this.__isChildElement(item)) {
        throw new Error("Could not check if " + item + " is selected," +
          " because it is not a child element!");
      }
      return this.__selected === item;
    },

    /**
     * Returns <code>true</code> if selection is empty.
     *
     * @return {Boolean} <code>true</code> if selection is empty,
     *    <code>false</code> otherwise.
     */
    isSelectionEmpty : function() {
      return this.__selected == null;
    },

    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables : function(all)
    {
      var items = this.__selectionProvider.getItems();
      var result = [];

      for (var i = 0; i < items.length; i++)
      {
        if (this.__selectionProvider.isItemSelectable(items[i])) {
          result.push(items[i]);
        }
      }

      // in case of an user selecable list, remove the enabled items
      if (!all) {
        for (var i = result.length -1; i >= 0; i--) {
          if (!result[i].getEnabled()) {
            result.splice(i, 1);
          }
        };
      }

      return result;
    },


    /*
    ---------------------------------------------------------------------------
       APPLY METHODS
    ---------------------------------------------------------------------------
    */


    // apply method
    __applyAllowEmptySelection : function(value, old)
    {
      if (!value) {
        this.__setSelected(this.__selected);
      }
    },


    /*
    ---------------------------------------------------------------------------
       HELPERS
    ---------------------------------------------------------------------------
    */

    /**
     * Set selected element.
     *
     * If passes value is <code>null</code>, the selection will be reseted.
     *
     * @param item {qx.ui.core.Widget | null} element to select, or
     *    <code>null</code> to reset selection.
     */
    __setSelected : function(item) {
      var oldSelected = this.__selected;
      var newSelected = item;

      if (newSelected != null && oldSelected === newSelected) {
        return;
      }

      if (!this.isAllowEmptySelection() && newSelected == null) {
        var firstElement = this.getSelectables(true)[0];

        if (firstElement) {
          newSelected = firstElement;
        }
      }

      this.__selected = newSelected;
      this.fireDataEvent("changeSelected", newSelected, oldSelected);
    },

    /**
     * Checks if passed element is a child element.
     *
     * @param item {qx.ui.core.Widget} Element to check if child element.
     * @return {Boolean} <code>true</code> if element is child element,
     *    <code>false</code> otherwise.
     */
    __isChildElement : function(item)
    {
      var items = this.__selectionProvider.getItems();

      for (var i = 0; i < items.length; i++)
      {
        if (items[i] === item)
        {
          return true;
        }
      }
      return false;
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */
  destruct : function() {
    if (this.__selectionProvider.toHashCode) {
      this._disposeObjects("__selectionProvider");
    } else {
      this.__selectionProvider = null;
    }

    this._disposeObjects("__selected");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */
/**
 * Defines the callback for the single selection manager.
 *
 * @internal
 */
qx.Interface.define("qx.ui.core.ISingleSelectionProvider",
{
  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Returns the elements which are part of the selection.
     *
     * @return {qx.ui.core.Widget[]} The widgets for the selection.
     */
    getItems: function() {},

    /**
     * Returns whether the given item is selectable.
     *
     * @param item {qx.ui.core.Widget} The item to be checked
     * @return {Boolean} Whether the given item is selectable
     */
    isItemSelectable : function(item) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This mixin offers the selection of the model properties.
 * It can only be included if the object including it implements the
 * {@link qx.ui.core.ISingleSelection} interface and the selectables implement
 * the {@link qx.ui.form.IModel} interface.
 */
qx.Mixin.define("qx.ui.form.MModelSelection",
{

  construct : function() {
    // create the selection array
    this.__modelSelection = new qx.data.Array();

    // listen to the changes
    this.__modelSelection.addListener("change", this.__onModelSelectionArrayChange, this);
    this.addListener("changeSelection", this.__onModelSelectionChange, this);
  },


  events :
  {
    /**
     * Pseudo event. It will never be fired because the array itself can not
     * be changed. But the event description is needed for the data binding.
     */
    changeModelSelection : "qx.event.type.Data"
  },


  members :
  {

    __modelSelection : null,
    __inSelectionChange : false,


    /**
     * Handler for the selection change of the including class e.g. SelectBox,
     * List, ...
     * It sets the new modelSelection via {@link #setModelSelection}.
     */
    __onModelSelectionChange : function() {
      if (this.__inSelectionChange) {
        return;
      }
      var data = this.getSelection();

      // create the array with the modes inside
      var modelSelection = [];
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        // fallback if getModel is not implemented
        var model = item.getModel ? item.getModel() : null;
        if (model !== null) {
          modelSelection.push(model);
        }
      };

      // only change the selection if you are sure that its correct [BUG #3748]
      if (modelSelection.length === data.length) {
        try {
          this.setModelSelection(modelSelection);
        } catch (e) {
          throw new Error(
            "Could not set the model selection. Maybe your models are not unique? " + e
          );
        }
      }
    },


    /**
     * Listener for the change of the internal model selection data array.
     */
    __onModelSelectionArrayChange : function() {
      this.__inSelectionChange = true;
      var selectables = this.getSelectables(true);
      var itemSelection = [];

      var modelSelection = this.__modelSelection.toArray();
      for (var i = 0; i < modelSelection.length; i++) {
        var model = modelSelection[i];
        for (var j = 0; j < selectables.length; j++) {
          var selectable = selectables[j];
          // fallback if getModel is not implemented
          var selectableModel = selectable.getModel ? selectable.getModel() : null;
          if (model === selectableModel) {
            itemSelection.push(selectable);
            break;
          }
        }
      }
      this.setSelection(itemSelection);
      this.__inSelectionChange = false;

      // check if the setting has worked
      var currentSelection = this.getSelection();
      if (!qx.lang.Array.equals(currentSelection, itemSelection)) {
        // if not, set the actual selection
        this.__onModelSelectionChange();
      }
    },


    /**
     * Returns always an array of the models of the selected items. If no
     * item is selected or no model is given, the array will be empty.
     *
     * *CAREFUL!* The model selection can only work if every item item in the
     * selection providing widget has a model property!
     *
     * @return {qx.data.Array} An array of the models of the selected items.
     */
    getModelSelection : function()
    {
      return this.__modelSelection;
    },


    /**
     * Takes the given models in the array and searches for the corresponding
     * selectables. If an selectable does have that model attached, it will be
     * selected.
     *
     * *Attention:* This method can have a time complexity of O(n^2)!
     *
     * *CAREFUL!* The model selection can only work if every item item in the
     * selection providing widget has a model property!
     *
     * @param modelSelection {Array} An array of models, which should be
     *   selected.
     */
    setModelSelection : function(modelSelection)
    {
      // check for null values
      if (!modelSelection)
      {
        this.__modelSelection.removeAll();
        return;
      }

      if (qx.core.Environment.get("qx.debug")) {
        this.assertArray(modelSelection, "Please use an array as parameter.");
      }

      // add the first two parameter
      modelSelection.unshift(this.__modelSelection.getLength()); // remove index
      modelSelection.unshift(0);  // start index

      var returnArray = this.__modelSelection.splice.apply(this.__modelSelection, modelSelection);
      returnArray.dispose();
    }
  },

  destruct : function() {
    this._disposeObjects("__modelSelection");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This interface should be used in all objects managing a set of items
 * implementing {@link qx.ui.form.IModel}.
 */
qx.Interface.define("qx.ui.form.IModelSelection",
{

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Tries to set the selection using the given array containing the
     * representative models for the selectables.
     *
     * @param value {Array} An array of models.
     */
    setModelSelection : function(value) {},


    /**
     * Returns an array of the selected models.
     *
     * @return {Array} An array containing the models of the currently selected
     *   items.
     */
    getModelSelection : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The radio group handles a collection of items from which only one item
 * can be selected. Selection another item will deselect the previously selected
 * item.
 *
 * This class is e.g. used to create radio groups or {@link qx.ui.form.RadioButton}
 * or {@link qx.ui.toolbar.RadioButton} instances.
 *
 * We also offer a widget for the same purpose which uses this class. So if
 * you like to act with a widget instead of a pure logic coupling of the
 * widgets, take a look at the {@link qx.ui.form.RadioButtonGroup} widget.
 */
qx.Class.define("qx.ui.form.RadioGroup",
{
  extend : qx.core.Object,
  implement : [
    qx.ui.core.ISingleSelection,
    qx.ui.form.IForm,
    qx.ui.form.IModelSelection
  ],
  include : [
    qx.ui.core.MSingleSelectionHandling,
    qx.ui.form.MModelSelection
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  /**
   * @param varargs {qx.core.Object} A variable number of items, which are
   *     initially added to the radio group, the first item will be selected.
   */
  construct : function(varargs)
  {
    this.base(arguments);

    // create item array
    this.__items = [];

    // add listener before call add!!!
    this.addListener("changeSelection", this.__onChangeSelection, this);

    if (varargs != null) {
      this.add.apply(this, arguments);
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */


  properties :
  {
    /**
     * Whether the radio group is enabled
     */
    enabled :
    {
      check : "Boolean",
      apply : "_applyEnabled",
      event : "changeEnabled",
      init: true
    },

    /**
     * Whether the selection should wrap around. This means that the successor of
     * the last item is the first item.
     */
    wrap :
    {
      check : "Boolean",
      init: true
    },

    /**
     * If is set to <code>true</code> the selection could be empty,
     * otherwise is always one <code>RadioButton</code> selected.
     */
    allowEmptySelection :
    {
      check : "Boolean",
      init : false,
      apply : "_applyAllowEmptySelection"
    },

    /**
     * Flag signaling if the group at all is valid. All children will have the
     * same state.
     */
    valid : {
      check : "Boolean",
      init : true,
      apply : "_applyValid",
      event : "changeValid"
    },

    /**
     * Flag signaling if the group is required.
     */
    required : {
      check : "Boolean",
      init : false,
      event : "changeRequired"
    },

    /**
     * Message which is shown in an invalid tooltip.
     */
    invalidMessage : {
      check : "String",
      init: "",
      event : "changeInvalidMessage",
      apply : "_applyInvalidMessage"
    },


    /**
     * Message which is shown in an invalid tooltip if the {@link #required} is
     * set to true.
     */
    requiredInvalidMessage : {
      check : "String",
      nullable : true,
      event : "changeInvalidMessage"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */


  members :
  {
    /** {qx.ui.form.IRadioItem[]} The items of the radio group */
    __items : null,


    /*
    ---------------------------------------------------------------------------
      UTILITIES
    ---------------------------------------------------------------------------
    */


    /**
     * Get all managed items
     *
     * @return {qx.ui.form.IRadioItem[]} All managed items.
     */
    getItems : function() {
      return this.__items;
    },


    /*
    ---------------------------------------------------------------------------
      REGISTRY
    ---------------------------------------------------------------------------
    */


    /**
     * Add the passed items to the radio group.
     *
     * @param varargs {qx.ui.form.IRadioItem} A variable number of items to add.
     */
    add : function(varargs)
    {
      var items = this.__items;
      var item;

      for (var i=0, l=arguments.length; i<l; i++)
      {
        item = arguments[i];

        if (qx.lang.Array.contains(items, item)) {
          continue;
        }

        // Register listeners
        item.addListener("changeValue", this._onItemChangeChecked, this);

        // Push RadioButton to array
        items.push(item);

        // Inform radio button about new group
        item.setGroup(this);

        // Need to update internal value?
        if (item.getValue()) {
          this.setSelection([item]);
        }
      }

      // Select first item when only one is registered
      if (!this.isAllowEmptySelection() && items.length > 0 && !this.getSelection()[0]) {
        this.setSelection([items[0]]);
      }
    },

    /**
     * Remove an item from the radio group.
     *
     * @param item {qx.ui.form.IRadioItem} The item to remove.
     */
    remove : function(item)
    {
      var items = this.__items;
      if (qx.lang.Array.contains(items, item))
      {
        // Remove RadioButton from array
        qx.lang.Array.remove(items, item);

        // Inform radio button about new group
        if (item.getGroup() === this) {
          item.resetGroup();
        }

        // Deregister listeners
        item.removeListener("changeValue", this._onItemChangeChecked, this);

        // if the radio was checked, set internal selection to null
        if (item.getValue()) {
          this.resetSelection();
        }
      }
    },


    /**
     * Returns an array containing the group's items.
     *
     * @return {qx.ui.form.IRadioItem[]} The item array
     */
    getChildren : function()
    {
      return this.__items;
    },


    /*
    ---------------------------------------------------------------------------
      LISTENER FOR ITEM CHANGES
    ---------------------------------------------------------------------------
    */


    /**
     * Event listener for <code>changeValue</code> event of every managed item.
     *
     * @param e {qx.event.type.Data} Data event
     */
    _onItemChangeChecked : function(e)
    {
      var item = e.getTarget();
      if (item.getValue()) {
        this.setSelection([item]);
      } else if (this.getSelection()[0] == item) {
        this.resetSelection();
      }
    },


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */
    // property apply
    _applyInvalidMessage : function(value, old) {
      for (var i = 0; i < this.__items.length; i++) {
        this.__items[i].setInvalidMessage(value);
      }
    },

    // property apply
    _applyValid: function(value, old) {
      for (var i = 0; i < this.__items.length; i++) {
        this.__items[i].setValid(value);
      }
    },

    // property apply
    _applyEnabled : function(value, old)
    {
      var items = this.__items;
      if (value == null)
      {
        for (var i=0, l=items.length; i<l; i++) {
          items[i].resetEnabled();
        }
      }
      else
      {
        for (var i=0, l=items.length; i<l; i++) {
          items[i].setEnabled(value);
        }
      }
    },

    // property apply
    _applyAllowEmptySelection : function(value, old)
    {
      if (!value && this.isSelectionEmpty()) {
        this.resetSelection();
      }
    },


    /*
    ---------------------------------------------------------------------------
      SELECTION
    ---------------------------------------------------------------------------
    */


    /**
     * Select the item following the given item.
     */
    selectNext : function()
    {
      var item = this.getSelection()[0];
      var items = this.__items;
      var index = items.indexOf(item);
      if (index == -1) {
        return;
      }

      var i = 0;
      var length = items.length;

      // Find next enabled item
      if (this.getWrap()) {
        index = (index + 1) % length;
      } else {
        index = Math.min(index + 1, length - 1);
      }

      while (i < length && !items[index].getEnabled())
      {
        index = (index + 1) % length;
        i++;
      }

      this.setSelection([items[index]]);
    },


    /**
     * Select the item previous the given item.
     */
    selectPrevious : function()
    {
      var item = this.getSelection()[0];
      var items = this.__items;
      var index = items.indexOf(item);
      if (index == -1) {
        return;
      }

      var i = 0;
      var length = items.length;

      // Find previous enabled item
      if (this.getWrap()) {
        index = (index - 1 + length) % length;
      } else {
        index = Math.max(index - 1, 0);
      }

      while (i < length && !items[index].getEnabled())
      {
        index = (index - 1 + length) % length;
        i++;
      }

      this.setSelection([items[index]]);
    },


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS FOR SELECTION API
    ---------------------------------------------------------------------------
    */


    /**
     * Returns the items for the selection.
     *
     * @return {qx.ui.form.IRadioItem[]} Items to select.
     */
    _getItems : function() {
      return this.getItems();
    },

    /**
     * Returns if the selection could be empty or not.
     *
     * @return {Boolean} <code>true</code> If selection could be empty,
     *    <code>false</code> otherwise.
     */
    _isAllowEmptySelection: function() {
      return this.isAllowEmptySelection();
    },


    /**
     * Returns whether the item is selectable. In opposite to the default
     * implementation (which checks for visible items) every radio button
     * which is part of the group is selected even if it is currently not visible.
     *
     * @param item {qx.ui.form.IRadioItem} The item to check if its selectable.
     * @return {Boolean} <code>true</code> if the item is part of the radio group
     *    <code>false</code> otherwise.
     */
    _isItemSelectable : function(item) {
      return this.__items.indexOf(item) != -1;
    },


    /**
     * Event handler for <code>changeSelection</code>.
     *
     * @param e {qx.event.type.Data} Data event.
     */
    __onChangeSelection : function(e)
    {
      var value = e.getData()[0];
      var old = e.getOldData()[0];

      if (old) {
        old.setValue(false);
      }

      if (value) {
        value.setValue(true);
      }
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */


  destruct : function() {
    this._disposeArray("__items");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Form interface for all form widgets which have boolean as their primary
 * data type like a checkbox.
 */
qx.Interface.define("qx.ui.form.IBooleanForm",
{
  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the value was modified */
    "changeValue" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      VALUE PROPERTY
    ---------------------------------------------------------------------------
    */

    /**
     * Sets the element's value.
     *
     * @param value {Boolean|null} The new value of the element.
     */
    setValue : function(value) {
      return arguments.length == 1;
    },


    /**
     * Resets the element's value to its initial value.
     */
    resetValue : function() {},


    /**
     * The element's user set value.
     *
     * @return {Boolean|null} The value.
     */
    getValue : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * A toggle Button widget
 *
 * If the user presses the button by clicking on it pressing the enter or
 * space key, the button toggles between the pressed an not pressed states.
 * There is no execute event, only a {@link qx.ui.form.ToggleButton#changeValue}
 * event.
 */
qx.Class.define("qx.ui.form.ToggleButton",
{
  extend : qx.ui.basic.Atom,
  include : [
    qx.ui.core.MExecutable
  ],
  implement : [
    qx.ui.form.IBooleanForm,
    qx.ui.form.IExecutable,
    qx.ui.form.IRadioItem
  ],



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Creates a ToggleButton.
   *
   * @param label {String} The text on the button.
   * @param icon {String} An URI to the icon of the button.
   */
  construct : function(label, icon)
  {
    this.base(arguments, label, icon);

    // register mouse events
    this.addListener("mouseover", this._onMouseOver);
    this.addListener("mouseout", this._onMouseOut);
    this.addListener("mousedown", this._onMouseDown);
    this.addListener("mouseup", this._onMouseUp);

    // register keyboard events
    this.addListener("keydown", this._onKeyDown);
    this.addListener("keyup", this._onKeyUp);

    // register execute event
    this.addListener("execute", this._onExecute, this);

  },



  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties:
  {
    // overridden
    appearance:
    {
      refine: true,
      init: "button"
    },

    // overridden
    focusable :
    {
      refine : true,
      init : true
    },

    /** The value of the widget. True, if the widget is checked. */
    value :
    {
      check : "Boolean",
      nullable : true,
      event : "changeValue",
      apply : "_applyValue",
      init : false
    },

    /** The assigned qx.ui.form.RadioGroup which handles the switching between registered buttons. */
    group :
    {
      check  : "qx.ui.form.RadioGroup",
      nullable : true,
      apply : "_applyGroup"
    },

    /**
    * Whether the button has a third state. Use this for tri-state checkboxes.
    *
    * When enabled, the value null of the property value stands for "undetermined",
    * while true is mapped to "enabled" and false to "disabled" as usual. Note
    * that the value property is set to false initially.
    *
    */
    triState :
    {
      check : "Boolean",
      apply : "_applyTriState",
      nullable : true,
      init : null
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** The assigned {@link qx.ui.form.RadioGroup} which handles the switching between registered buttons */
    _applyGroup : function(value, old)
    {
      if (old) {
        old.remove(this);
      }

      if (value) {
        value.add(this);
      }
    },


    /**
     * Changes the state of the button dependent on the checked value.
     *
     * @param value {Boolean} Current value
     * @param old {Boolean} Previous value
     */
    _applyValue : function(value, old) {
      value ? this.addState("checked") : this.removeState("checked");

      if (this.isTriState()) {
        if (value === null) {
          this.addState("undetermined");
        } else if (old === null) {
          this.removeState("undetermined");
        }
      }
    },

    /**
    * Apply value property when triState property is modified.
    *
    * @param value {Boolean} Current value
    * @param old {Boolean} Previous value
    */
    _applyTriState : function(value, old) {
      this._applyValue(this.getValue());
    },


    /**
     * Handler for the execute event.
     *
     * @param e {qx.event.type.Event} The execute event.
     */
    _onExecute : function(e) {
      this.toggleValue();
    },


    /**
     * Listener method for "mouseover" event.
     * <ul>
     * <li>Adds state "hovered"</li>
     * <li>Removes "abandoned" and adds "pressed" state (if "abandoned" state is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onMouseOver : function(e)
    {
      if (e.getTarget() !== this) {
        return;
      }

      this.addState("hovered");

      if (this.hasState("abandoned"))
      {
        this.removeState("abandoned");
        this.addState("pressed");
      }
    },


    /**
     * Listener method for "mouseout" event.
     * <ul>
     * <li>Removes "hovered" state</li>
     * <li>Adds "abandoned" state (if "pressed" state is set)</li>
     * <li>Removes "pressed" state (if "pressed" state is set and button is not checked)
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onMouseOut : function(e)
    {
      if (e.getTarget() !== this) {
        return;
      }

      this.removeState("hovered");

      if (this.hasState("pressed"))
      {
        if (!this.getValue()) {
          this.removeState("pressed");
        }

        this.addState("abandoned");
      }
    },


    /**
     * Listener method for "mousedown" event.
     * <ul>
     * <li>Activates capturing</li>
     * <li>Removes "abandoned" state</li>
     * <li>Adds "pressed" state</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onMouseDown : function(e)
    {
      if (!e.isLeftPressed()) {
        return;
      }

      // Activate capturing if the button get a mouseout while
      // the button is pressed.
      this.capture();

      this.removeState("abandoned");
      this.addState("pressed");
      e.stopPropagation();
    },


    /**
     * Listener method for "mouseup" event.
     * <ul>
     * <li>Releases capturing</li>
     * <li>Removes "pressed" state (if not "abandoned" state is set and "pressed" state is set)</li>
     * <li>Removes "abandoned" state (if set)</li>
     * <li>Toggles {@link #value} (if state "abandoned" is not set and state "pressed" is set)</li>
     * </ul>
     *
     * @param e {Event} Mouse event
     */
    _onMouseUp : function(e)
    {
      this.releaseCapture();

      if (this.hasState("abandoned")) {
        this.removeState("abandoned");
      } else if (this.hasState("pressed")) {
        this.execute();
      }

      this.removeState("pressed");
      e.stopPropagation();
    },


    /**
     * Listener method for "keydown" event.<br/>
     * Removes "abandoned" and adds "pressed" state
     * for the keys "Enter" or "Space"
     *
     * @param e {Event} Key event
     */
    _onKeyDown : function(e)
    {
      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          this.removeState("abandoned");
          this.addState("pressed");

          e.stopPropagation();
      }
    },


    /**
     * Listener method for "keyup" event.<br/>
     * Removes "abandoned" and "pressed" state (if "pressed" state is set)
     * for the keys "Enter" or "Space". It also toggles the {@link #value} property.
     *
     * @param e {Event} Key event
     */
    _onKeyUp : function(e)
    {
      if (!this.hasState("pressed")) {
        return;
      }

      switch(e.getKeyIdentifier())
      {
        case "Enter":
        case "Space":
          this.removeState("abandoned");
          this.execute();

          this.removeState("pressed");
          e.stopPropagation();
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Can be included for implementing {@link qx.ui.form.IModel}. It only contains
 * a nullable property named 'model' with a 'changeModel' event.
 */
qx.Mixin.define("qx.ui.form.MModelProperty",
{
  properties :
  {
    /**
     * Model property for storing additional information for the including
     * object. It can act as value property on form items for example.
     *
     * Be careful using that property as this is used for the
     * {@link qx.ui.form.MModelSelection} it has some restrictions:
     *
     * * Don't use equal models in one widget using the
     *     {@link qx.ui.form.MModelSelection}.
     *
     * * Avoid setting only some model properties if the widgets are added to
     *     a {@link qx.ui.form.MModelSelection} widge.
     *
     * Both restrictions result of the fact, that the set models are deputies
     * for their widget.
     */
    model :
    {
      nullable: true,
      event: "changeModel",
      dereference : true
    }
  }
});/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Each object which wants to store data representative for the real item
 * should implement this interface.
 */
qx.Interface.define("qx.ui.form.IModel",
{

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when the model data changes */
    "changeModel" : "qx.event.type.Data"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Set the representative data for the item.
     *
     * @param value {var} The data.
     */
    setModel : function(value) {},


    /**
     * Returns the representative data for the item
     *
     * @return {var} The data.
     */
    getModel : function() {},


    /**
     * Sets the representative data to null.
     */
    resetModel : function() {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * A check box widget with an optional label.
 */
qx.Class.define("qx.ui.form.CheckBox",
{
  extend : qx.ui.form.ToggleButton,
  include : [
    qx.ui.form.MForm,
    qx.ui.form.MModelProperty
  ],
  implement : [
    qx.ui.form.IForm,
    qx.ui.form.IModel
  ],

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String?null} An optional label for the check box.
   */
  construct : function(label)
  {
    if (qx.core.Environment.get("qx.debug")) {
      this.assertArgumentsCount(arguments, 0, 1);
    }

    this.base(arguments, label);

    // Initialize the checkbox to a valid value (the default is null which
    // is invalid)
    this.setValue(false);
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    appearance :
    {
      refine : true,
      init : "checkbox"
    },

    // overridden
    allowGrowX :
    {
      refine : true,
      init : false
    }
  },

  members :
  {
    // overridden
    /** @lint ignoreReferenceField(_forwardStates,_bindableProperties) */
    _forwardStates :
    {
      invalid : true,
      focused : true,
      undetermined : true,
      checked : true,
      hovered : true
    },


    // overridden (from MExecutable to keet the icon out of the binding)
    /** @lint ignoreReferenceField(_bindableProperties) */
    _bindableProperties :
    [
      "enabled",
      "label",
      "toolTipText",
      "value",
      "menu"
    ]
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The radio container handles a collection of items from which only one item
 * can be selected. Selection another item will deselect the previously selected
 * item. For that, it uses the {@link qx.ui.form.RadioGroup} object.
 *
 * This class is used to create radio groups of {@link qx.ui.form.RadioButton}
 * instances.
 *
 * This widget takes care of the layout of the added items. If you want to
 * take full control of the layout and just use the selection behavior,
 * take a look at the {@link qx.ui.form.RadioGroup} object for a loose coupling.
 */
qx.Class.define("qx.ui.form.RadioButtonGroup",
{
  extend : qx.ui.core.Widget,
  include : [qx.ui.core.MLayoutHandling, qx.ui.form.MModelSelection],
  implement : [
    qx.ui.form.IForm,
    qx.ui.core.ISingleSelection,
    qx.ui.form.IModelSelection
  ],


  /**
   * @param layout {qx.ui.layout.Abstract} The new layout or
   *     <code>null</code> to reset the layout.
   */
  construct : function(layout)
  {
    this.base(arguments);

    // if no layout is given, use the default layout (VBox)
    if (layout == null) {
      this.setLayout(new qx.ui.layout.VBox(4));
    } else {
      this.setLayout(layout);
    }

    // create the radio group
    this.__radioGroup = new qx.ui.form.RadioGroup();

    // attach the listener
    this.__radioGroup.addListener("changeSelection", function(e) {
      this.fireDataEvent("changeSelection", e.getData(), e.getOldData());
    }, this);
  },


  properties :
  {
    /**
     * Flag signaling if the group at all is valid. All children will have the
     * same state.
     */
    valid : {
      check : "Boolean",
      init : true,
      apply : "_applyValid",
      event : "changeValid"
    },

    /**
     * Flag signaling if the group is required.
     */
    required : {
      check : "Boolean",
      init : false,
      event : "changeRequired"
    },

    /**
     * Message which is shown in an invalid tooltip.
     */
    invalidMessage : {
      check : "String",
      init: "",
      event : "changeInvalidMessage",
      apply : "_applyInvalidMessage"
    },


    /**
     * Message which is shown in an invalid tooltip if the {@link #required} is
     * set to true.
     */
    requiredInvalidMessage : {
      check : "String",
      nullable : true,
      event : "changeInvalidMessage"
    }
  },


  events :
  {
    /**
     * Fires after the selection was modified
     */
    "changeSelection" : "qx.event.type.Data"
  },


  members :
  {
    __radioGroup : null,


    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */
    // property apply
    _applyInvalidMessage : function(value, old) {
      var children = this._getChildren();
      for (var i = 0; i < children.length; i++) {
        children[i].setInvalidMessage(value);
      }
    },


    // property apply
    _applyValid: function(value, old) {
      var children = this._getChildren();
      for (var i = 0; i < children.length; i++) {
        children[i].setValid(value);
      }
    },


    /*
    ---------------------------------------------------------------------------
      REGISTRY
    ---------------------------------------------------------------------------
    */

    /**
     * The internaly used radio group instance will be returned.
     *
     * @return {qx.ui.form.RadioGroup} Returns the used RadioGroup instance.
     */
    getRadioGroup : function() {
      return this.__radioGroup;
    },


    /**
     * Returns the children list
     *
     * @return {qx.ui.core.LayoutItem[]} The children array.
     */
    getChildren : function() {
      return this._getChildren();
    },


    /**
     * Adds a new child widget.
     *
     * The supported keys of the layout options map depend on the layout
     * used to position the widget. The options are documented in the class
     * documentation of each layout manager {@link qx.ui.layout}.
     *
     * @param child {qx.ui.core.LayoutItem} the widget to add.
     * @param options {Map?null} Optional layout data for widget.
     */
    add : function(child, options) {
      this.__radioGroup.add(child);
      this._add(child, options);
    },


    /**
     * Remove the given child widget.
     *
     * @param child {qx.ui.core.LayoutItem} the widget to remove
     */
    remove : function(child)
    {
      this.__radioGroup.remove(child);
      this._remove(child);
    },


    /**
     * Remove all children.
     *
     * @return {Array} An array of {@link qx.ui.core.LayoutItem}'s.
     */
    removeAll : function()
    {
      // remove all children from the radio group
      var radioItems = this.__radioGroup.getItems();
      for (var i = 0; i < radioItems.length; i++) {
        this.__radioGroup.remove(radioItems[i]);
      }

      return this._removeAll();
    },



    /*
    ---------------------------------------------------------------------------
      SELECTION
    ---------------------------------------------------------------------------
    */

    /**
     * Returns an array of currently selected items.
     *
     * Note: The result is only a set of selected items, so the order can
     * differ from the sequence in which the items were added.
     *
     * @return {qx.ui.core.Widget[]} List of items.
     */
    getSelection : function() {
      return this.__radioGroup.getSelection();
    },


    /**
     * Replaces current selection with the given items.
     *
     * @param items {qx.ui.core.Widget[]} Items to select.
     * @throws {Error} if the item is not a child element.
     */
    setSelection : function(items) {
      this.__radioGroup.setSelection(items);
    },


    /**
     * Clears the whole selection at once.
     */
    resetSelection : function() {
      this.__radioGroup.resetSelection();
    },


    /**
     * Detects whether the given item is currently selected.
     *
     * @param item {qx.ui.core.Widget} Any valid selectable item
     * @return {Boolean} Whether the item is selected.
     * @throws {Error} if the item is not a child element.
     */
    isSelected : function(item) {
      return this.__radioGroup.isSelected(item);
    },


    /**
     * Whether the selection is empty.
     *
     * @return {Boolean} Whether the selection is empty.
     */
    isSelectionEmpty : function() {
      return this.__radioGroup.isSelectionEmpty();
    },


    /**
     * Returns all elements which are selectable.
     *
     * @param all {Boolean} true for all selectables, false for the
     *   selectables the user can interactively select
     * @return {qx.ui.core.Widget[]} The contained items.
     */
    getSelectables: function(all) {
      return this.__radioGroup.getSelectables(all);
    }
  },


  destruct : function()
  {
    this._disposeObjects("__radioGroup");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A vertical box layout.
 *
 * The vertical box layout lays out widgets in a vertical column, from top
 * to bottom.
 *
 * *Features*
 *
 * * Minimum and maximum dimensions
 * * Prioritized growing/shrinking (flex)
 * * Margins (with vertical collapsing)
 * * Auto sizing (ignoring percent values)
 * * Percent heights (not relevant for size hint)
 * * Alignment (child property {@link qx.ui.core.LayoutItem#alignY} is ignored)
 * * Vertical spacing (collapsed with margins)
 * * Reversed children layout (from last to first)
 * * Horizontal children stretching (respecting size hints)
 *
 * *Item Properties*
 *
 * <ul>
 * <li><strong>flex</strong> <em>(Integer)</em>: The flexibility of a layout item determines how the container
 *   distributes remaining empty space among its children. If items are made
 *   flexible, they can grow or shrink accordingly. Their relative flex values
 *   determine how the items are being resized, i.e. the larger the flex ratio
 *   of two items, the larger the resizing of the first item compared to the
 *   second.
 *
 *   If there is only one flex item in a layout container, its actual flex
 *   value is not relevant. To disallow items to become flexible, set the
 *   flex value to zero.
 * </li>
 * <li><strong>height</strong> <em>(String)</em>: Allows to define a percent
 *   height for the item. The height in percent, if specified, is used instead
 *   of the height defined by the size hint. The minimum and maximum height still
 *   takes care of the element's limits. It has no influence on the layout's
 *   size hint. Percent values are mostly useful for widgets which are sized by
 *   the outer hierarchy.
 * </li>
 * </ul>
 *
 * *Example*
 *
 * Here is a little example of how to use the grid layout.
 *
 * <pre class="javascript">
 * var layout = new qx.ui.layout.VBox();
 * layout.setSpacing(4); // apply spacing
 *
 * var container = new qx.ui.container.Composite(layout);
 *
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * container.add(new qx.ui.core.Widget());
 * </pre>
 *
 * *External Documentation*
 *
 * See <a href='http://manual.qooxdoo.org/${qxversion}/pages/layout/box.html'>extended documentation</a>
 * and links to demos for this layout.
 *
 */
qx.Class.define("qx.ui.layout.VBox",
{
  extend : qx.ui.layout.Abstract,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param spacing {Integer?0} The spacing between child widgets {@link #spacing}.
   * @param alignY {String?"top"} Vertical alignment of the whole children
   *     block {@link #alignY}.
   * @param separator {Decorator} A separator to render between the items
   */
  construct : function(spacing, alignY, separator)
  {
    this.base(arguments);

    if (spacing) {
      this.setSpacing(spacing);
    }

    if (alignY) {
      this.setAlignY(alignY);
    }

    if (separator) {
      this.setSeparator(separator);
    }
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Vertical alignment of the whole children block. The vertical
     * alignment of the child is completely ignored in VBoxes (
     * {@link qx.ui.core.LayoutItem#alignY}).
     */
    alignY :
    {
      check : [ "top", "middle", "bottom" ],
      init : "top",
      apply : "_applyLayoutChange"
    },


    /**
     * Horizontal alignment of each child. Can be overridden through
     * {@link qx.ui.core.LayoutItem#alignX}.
     */
    alignX :
    {
      check : [ "left", "center", "right" ],
      init : "left",
      apply : "_applyLayoutChange"
    },


    /** Vertical spacing between two children */
    spacing :
    {
      check : "Integer",
      init : 0,
      apply : "_applyLayoutChange"
    },


    /** Separator lines to use between the objects */
    separator :
    {
      check : "Decorator",
      nullable : true,
      apply : "_applyLayoutChange"
    },


    /** Whether the actual children list should be laid out in reversed order. */
    reversed :
    {
      check : "Boolean",
      init : false,
      apply : "_applyReversed"
    }
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __heights : null,
    __flexs : null,
    __enableFlex : null,
    __children : null,


    /*
    ---------------------------------------------------------------------------
      HELPER METHODS
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyReversed : function()
    {
      // easiest way is to invalidate the cache
      this._invalidChildrenCache = true;

      // call normal layout change
      this._applyLayoutChange();
    },


    /**
     * Rebuilds caches for flex and percent layout properties
     */
    __rebuildCache : function()
    {
      var children = this._getLayoutChildren();
      var length = children.length;
      var enableFlex = false;
      var reuse = this.__heights && this.__heights.length != length && this.__flexs && this.__heights;
      var props;

      // Sparse array (keep old one if lengths has not been modified)
      var heights = reuse ? this.__heights : new Array(length);
      var flexs = reuse ? this.__flexs : new Array(length);

      // Reverse support
      if (this.getReversed()) {
        children = children.concat().reverse();
      }

      // Loop through children to preparse values
      for (var i=0; i<length; i++)
      {
        props = children[i].getLayoutProperties();

        if (props.height != null) {
          heights[i] = parseFloat(props.height) / 100;
        }

        if (props.flex != null)
        {
          flexs[i] = props.flex;
          enableFlex = true;
        } else {
          // reset (in case the index of the children changed: BUG #3131)
          flexs[i] = 0;
        }
      }

      // Store data
      if (!reuse)
      {
        this.__heights = heights;
        this.__flexs = flexs;
      }

      this.__enableFlex = enableFlex
      this.__children = children;

      // Clear invalidation marker
      delete this._invalidChildrenCache;
    },





    /*
    ---------------------------------------------------------------------------
      LAYOUT INTERFACE
    ---------------------------------------------------------------------------
    */

    // overridden
    verifyLayoutProperty : qx.core.Environment.select("qx.debug",
    {
      "true" : function(item, name, value)
      {
        this.assert(name === "flex" || name === "height", "The property '"+name+"' is not supported by the VBox layout!");

        if (name =="height")
        {
          this.assertMatch(value, qx.ui.layout.Util.PERCENT_VALUE);
        }
        else
        {
          // flex
          this.assertNumber(value);
          this.assert(value >= 0);
        }
      },

      "false" : null
    }),


    // overridden
    renderLayout : function(availWidth, availHeight)
    {
      // Rebuild flex/height caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      // Cache children
      var children = this.__children;
      var length = children.length;
      var util = qx.ui.layout.Util;


      // Compute gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeVerticalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeVerticalGaps(children, spacing, true);
      }


      // First run to cache children data and compute allocated height
      var i, child, height, percent;
      var heights = [];
      var allocatedHeight = gaps;

      for (i=0; i<length; i+=1)
      {
        percent = this.__heights[i];

        height = percent != null ?
          Math.floor((availHeight - gaps) * percent) :
          children[i].getSizeHint().height;

        heights.push(height);
        allocatedHeight += height;
      }


      // Flex support (growing/shrinking)
      if (this.__enableFlex && allocatedHeight != availHeight)
      {
        var flexibles = {};
        var flex, offset;

        for (i=0; i<length; i+=1)
        {
          flex = this.__flexs[i];

          if (flex > 0)
          {
            hint = children[i].getSizeHint();

            flexibles[i]=
            {
              min : hint.minHeight,
              value : heights[i],
              max : hint.maxHeight,
              flex : flex
            };
          }
        }

        var result = util.computeFlexOffsets(flexibles, availHeight, allocatedHeight);

        for (i in result)
        {
          offset = result[i].offset;

          heights[i] += offset;
          allocatedHeight += offset;
        }
      }


      // Start with top coordinate
      var top = children[0].getMarginTop();

      // Alignment support
      if (allocatedHeight < availHeight && this.getAlignY() != "top")
      {
        top = availHeight - allocatedHeight;

        if (this.getAlignY() === "middle") {
          top = Math.round(top / 2);
        }
      }


      // Layouting children
      var hint, left, width, height, marginBottom, marginLeft, marginRight;

      // Pre configure separators
      this._clearSeparators();

      // Compute separator height
      if (separator)
      {
        var separatorInsets = qx.theme.manager.Decoration.getInstance().resolve(separator).getInsets();
        var separatorHeight = separatorInsets.top + separatorInsets.bottom;
      }

      // Render children and separators
      for (i=0; i<length; i+=1)
      {
        child = children[i];
        height = heights[i];
        hint = child.getSizeHint();

        marginLeft = child.getMarginLeft();
        marginRight = child.getMarginRight();

        // Find usable width
        width = Math.max(hint.minWidth, Math.min(availWidth-marginLeft-marginRight, hint.maxWidth));

        // Respect horizontal alignment
        left = util.computeHorizontalAlignOffset(child.getAlignX()||this.getAlignX(), width, availWidth, marginLeft, marginRight);

        // Add collapsed margin
        if (i > 0)
        {
          // Whether a separator has been configured
          if (separator)
          {
            // add margin of last child and spacing
            top += marginBottom + spacing;

            // then render the separator at this position
            this._renderSeparator(separator, {
              top : top,
              left : 0,
              height : separatorHeight,
              width : availWidth
            });

            // and finally add the size of the separator, the spacing (again) and the top margin
            top += separatorHeight + spacing + child.getMarginTop();
          }
          else
          {
            // Support margin collapsing when no separator is defined
            top += util.collapseMargins(spacing, marginBottom, child.getMarginTop());
          }
        }

        // Layout child
        child.renderLayout(left, top, width, height);

        // Add height
        top += height;

        // Remember bottom margin (for collapsing)
        marginBottom = child.getMarginBottom();
      }
    },


    // overridden
    _computeSizeHint : function()
    {
      // Rebuild flex/height caches
      if (this._invalidChildrenCache) {
        this.__rebuildCache();
      }

      var util = qx.ui.layout.Util;
      var children = this.__children;

      // Initialize
      var minHeight=0, height=0, percentMinHeight=0;
      var minWidth=0, width=0;
      var child, hint, margin;

      // Iterate over children
      for (var i=0, l=children.length; i<l; i+=1)
      {
        child = children[i];
        hint = child.getSizeHint();

        // Sum up heights
        height += hint.height;

        // Detect if child is shrinkable or has percent height and update minHeight
        var flex = this.__flexs[i];
        var percent = this.__heights[i];
        if (flex) {
          minHeight += hint.minHeight;
        } else if (percent) {
          percentMinHeight = Math.max(percentMinHeight, Math.round(hint.minHeight/percent));
        } else {
          minHeight += hint.height;
        }

        // Build horizontal margin sum
        margin = child.getMarginLeft() + child.getMarginRight();

        // Find biggest width
        if ((hint.width+margin) > width) {
          width = hint.width + margin;
        }

        // Find biggest minWidth
        if ((hint.minWidth+margin) > minWidth) {
          minWidth = hint.minWidth + margin;
        }
      }

      minHeight += percentMinHeight;

      // Respect gaps
      var spacing = this.getSpacing();
      var separator = this.getSeparator();
      if (separator) {
        var gaps = util.computeVerticalSeparatorGaps(children, spacing, separator);
      } else {
        var gaps = util.computeVerticalGaps(children, spacing, true);
      }

      // Return hint
      return {
        minHeight : minHeight + gaps,
        height : height + gaps,
        minWidth : minWidth,
        width : width
      };
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__heights = this.__flexs = this.__children = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * Radio buttons can be used in radio groups to allow to the user to select
 * exactly one item from a list. Radio groups are established by adding
 * radio buttons to a radio manager {@link qx.ui.form.RadioGroup}.
 *
 * Example:
 * <pre class="javascript">
 *   var container = new qx.ui.container.Composite(new qx.ui.layout.VBox);
 *
 *   var female = new qx.ui.form.RadioButton("female");
 *   var male = new qx.ui.form.RadioButton("male");
 *
 *   var mgr = new qx.ui.form.RadioGroup();
 *   mgr.add(female, male);
 *
 *   container.add(male);
 *   container.add(female);
 * </pre>
 */
qx.Class.define("qx.ui.form.RadioButton",
{
  extend : qx.ui.form.Button,
  include : [
    qx.ui.form.MForm,
    qx.ui.form.MModelProperty
  ],
  implement : [
    qx.ui.form.IRadioItem,
    qx.ui.form.IForm,
    qx.ui.form.IBooleanForm,
    qx.ui.form.IModel
  ],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param label {String?null} An optional label for the radio button.
   */
  construct : function(label)
  {
    if (qx.core.Environment.get("qx.debug")) {
      this.assertArgumentsCount(arguments, 0, 1);
    }

    this.base(arguments, label);

    // Add listeners
    this.addListener("execute", this._onExecute);
    this.addListener("keypress", this._onKeyPress);
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The assigned qx.ui.form.RadioGroup which handles the switching between registered buttons */
    group :
    {
      check  : "qx.ui.form.RadioGroup",
      nullable : true,
      apply : "_applyGroup"
    },

    /** The value of the widget. True, if the widget is checked. */
    value :
    {
      check : "Boolean",
      nullable : true,
      event : "changeValue",
      apply : "_applyValue",
      init: false
    },

    // overridden
    appearance :
    {
      refine : true,
      init : "radiobutton"
    },

    // overridden
    allowGrowX :
    {
      refine : true,
      init : false
    }
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      checked : true,
      focused : true,
      invalid : true,
      hovered : true
    },

    // overridden (from MExecutable to keet the icon out of the binding)
    /**
     * @lint ignoreReferenceField(_bindableProperties)
     */
    _bindableProperties :
    [
      "enabled",
      "label",
      "toolTipText",
      "value",
      "menu"
    ],

    /*
    ---------------------------------------------------------------------------
      APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyValue : function(value, old)
    {
      value ?
        this.addState("checked") :
        this.removeState("checked");
    },


    /** The assigned {@link qx.ui.form.RadioGroup} which handles the switching between registered buttons */
    _applyGroup : function(value, old)
    {
      if (old) {
        old.remove(this);
      }

      if (value) {
        value.add(this);
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT-HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for the "execute" event.
     *
     * Sets the property "checked" to true.
     *
     * @param e {qx.event.type.Event} execute event
     */
    _onExecute : function(e) {
      var grp = this.getGroup();
      if (grp && grp.getAllowEmptySelection()) {
        this.toggleValue();
      } else {
        this.setValue(true);
      }
    },


    /**
     * Event listener for the "keyPress" event.
     *
     * Selects the previous RadioButton when pressing "Left" or "Up" and
     * Selects the next RadioButton when pressing "Right" and "Down"
     *
     * @param e {qx.event.type.KeySequence} KeyPress event
     */
    _onKeyPress : function(e)
    {

      var grp = this.getGroup();
      if (!grp) {
        return;
      }

      switch(e.getKeyIdentifier())
      {
        case "Left":
        case "Up":
          grp.selectPrevious();
          break;

        case "Right":
        case "Down":
          grp.selectNext();
          break;
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)
     * Adrian Olaru (adrianolaru)

************************************************************************ */

/**
 * This static class contains a set of default validators.
 * These validators are listed twice
 * <ul>
 *   <li>number</li>
 *   <li>email</li>
 *   <li>string</li>
 *   <li>url</li>
 *   <li>color</li>
 * </ul>
 * All these validators don't need an input so the listed function just return a
 * method fitting for the use in the property system.
 * The methods with the check prefix are the returned methods and can be used in
 * other contexts without the property system.
 *
 * There are three more validators
 * <ul>
 *   <li>range</li>
 *   <li>inArray</li>
 *   <li>regExp</li>
 * </ul>
 * These methods do need some addition parameters to specify the validator. So
 * there is no check function which you can use in other contexts because the
 * check function for the validation is created based on the given parameter.
 *
 * *Example usage for a property*
 *
 * <code>validate: qx.util.Validate.number()</code>
 * <br>
 * <code>validate: qx.util.Validate.range(0, 100)</code>
 *
 * Because the methods without the check prefix return a validation method,
 * the function must be called at the property definition. So don't forget the
 * ending brackets for those methods without parameters!
 * For the correct usage, take an additional look at the documentation of the
 * {@link qx.core.Property} class.
 */
qx.Class.define("qx.util.Validate",
{
  statics :
  {
    /**
     * Returns the function that checks for a number.
     *
     * @param errorMessage {String?null} Custom error message.
     * @return {Function} The {@link #checkNumber} Function.
     */
    number : function(errorMessage) {
      return function(value) {
        qx.util.Validate.checkNumber(value, null, errorMessage);
      }
    },


    /**
     * The function checks the incoming value to see if it is a number.
     * If not, an ValidationError will be thrown.
     * If you want to use the number check in a property definition,
     * use the {@link #number} method.
     *
     * @param value {var} The value to check.
     * @param formItem {qx.ui.form.IForm} The form item to check if used in a
     *   {@link qx.ui.form.Form}.
     * @param errorMessage {String?undefined} Custom error message.
     * @throws {qx.core.ValidationError} If the value parameter is not a
     *    finite number
     */
    checkNumber : function(value, formItem, errorMessage)
    {
      errorMessage = errorMessage ||
        qx.locale.Manager.tr("%1 is not a number.", value);

      if ((typeof value !== "number" && (!(value instanceof Number)))
        || (!(isFinite(value))))
      {
        throw new qx.core.ValidationError("Validation Error", errorMessage);
      }
    },


    /**
     * Returns the function that checks for an email address.
     *
     * @param errorMessage {String?null} Custom error message.
     * @return {Function} The {@link #checkEmail} Function.
     */
    email : function(errorMessage) {
      return function(value) {
        qx.util.Validate.checkEmail(value, null, errorMessage);
      }
    },


    /**
     * The function checks the incoming value to see if it is an email address.
     * If not, an ValidationError will be thrown.
     * If you want to use the email check in a property definition,
     * use the {@link #email} method.
     *
     * @param value {var} The value to check.
     * @param formItem {qx.ui.form.IForm} The form item to check if used in a
     *   {@link qx.ui.form.Form}.
     * @param errorMessage {String?null} Custom error message.
     * @throws {qx.core.ValidationError} If the value parameter is not
     *    a valid email address.
     */
    checkEmail : function(value, formItem, errorMessage)
    {
      errorMessage = errorMessage ||
        qx.locale.Manager.tr("'%1' is not an email address.", (value || ""));

      var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
      if (reg.test(value) === false) {
        throw new qx.core.ValidationError("Validation Error",errorMessage);
      }
    },


    /**
     * Returns the function that checks for a string.
     *
     * @param errorMessage {String?null} Custom error message.
     * @return {Function} The {@link #checkString} Function.
     */
    string : function(errorMessage) {
      return function(value) {
        qx.util.Validate.checkString(value, null, errorMessage);
      }
    },


    /**
     * The function checks the incoming value to see if it is a string.
     * If not, an ValidationError will be thrown.
     * If you want to use the string check in a property definition,
     * use the {@link #string} method.
     *
     * @param value {var} The value to check.
     * @param formItem {qx.ui.form.IForm} The form item to check if used in a
     *   {@link qx.ui.form.Form}.
     * @param errorMessage {String?null} Custom error message.
     * @throws {qx.core.ValidationError} If the value parameter is not a string.
     */
    checkString : function(value, formItem, errorMessage)
    {
      errorMessage = errorMessage ||
        qx.locale.Manager.tr("%1 is not a string.", value);

      if (typeof value !== "string" && (!(value instanceof String))) {
        throw new qx.core.ValidationError("Validation Error", errorMessage);
      }
    },


    /**
     * Returns the function that checks for an url.
     *
     * @param errorMessage {String?null} Custom error message.
     * @return {Function} The {@link #checkUrl} Function.
     */
    url : function(errorMessage) {
      return function(value) {
        qx.util.Validate.checkUrl(value, null, errorMessage);
      }
    },


    /**
     * The function checks the incoming value to see if it is an url.
     * If not, an ValidationError will be thrown.
     * If you want to use the url check in a property definition,
     * use the {@link #url} method.
     *
     * @param value {var} The value to check.
     * @param formItem {qx.ui.form.IForm} The form item to check if used in a
     *   {@link qx.ui.form.Form}.
     * @param errorMessage {String?null} Custom error message.
     * @throws {qx.core.ValidationError} If the value parameter is not an url.
     */
    checkUrl : function(value, formItem, errorMessage)
    {
      errorMessage = errorMessage ||
        qx.locale.Manager.tr("%1 is not an url.", value);

      var reg =  /([A-Za-z0-9])+:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      if (!reg.test(value)) {
        throw new qx.core.ValidationError("Validation Error", errorMessage);
      }
    },


    /**
     * Returns the function that checks for a color.
     *
     * @param errorMessage {String?null} Custom error message.
     * @return {Function} The {@link #checkColor} Function.
     */
    color : function(errorMessage) {
      return function(value) {
        qx.util.Validate.checkColor(value, null, errorMessage);
      }
    },


    /**
     * The function checks the incoming value to see if it is a color.
     * If not, an ValidationError will be thrown. The check itself will be
     * delegated to the {@link qx.util.ColorUtil#stringToRgb} method.
     * If you want to use the color check in a property definition,
     * use the {@link #color} method.
     *
     * @param value {var} The value to check.
     * @param formItem {qx.ui.form.IForm} The form item to check if used in a
     *   {@link qx.ui.form.Form}.
     * @param errorMessage {String?null} Custom error message.
     * @throws {qx.core.ValidationError} If the value parameter is not a color.
     */
    checkColor : function(value, formItem, errorMessage)
    {
      try {
        qx.util.ColorUtil.stringToRgb(value);
      } catch (e) {
        var message = errorMessage ||
          qx.locale.Manager.tr("%1 is not a color! %2", value, e);
        throw new qx.core.ValidationError("Validation Error", message);
      }
    },


    /**
     * Returns a function that checks if the number is in the given range.
     * The range includes the border values.
     * A range from 1 to 2 accepts the values 1 equally as everything up to 2
     * including the 2.
     * If the value given to the returned function is out of the range, a
     * ValidationError will be thrown.
     *
     * @param from {Number} The lower border of the range.
     * @param to {Number} The upper border of the range.
     * @param errorMessage {String?null} Custom error message.
     * @return {Function} A function taking one parameter (value).
     */
    range : function(from, to, errorMessage)
    {
      return function(value)
      {
        var message = errorMessage ||
          qx.locale.Manager.tr("%1 is not in the range from [%2, %3].", value, from, to);

        if (value < from || value > to) {
          throw new qx.core.ValidationError("Validation Error", message);
        }
      }
    },


    /**
     * Returns a function that checks if the given value is in the array.
     * If the value given to the returned function is not in the array, a
     * ValidationError will be thrown.
     *
     * @param array {Array} The array holding the possibilities.
     * @param errorMessage {String?null} Custom error message.
     * @return {Function} A function taking one parameter (value).
     */
    inArray : function(array, errorMessage)
    {
      return function(value)
      {
        var message = errorMessage ||
          qx.locale.Manager.tr("%1 is not in %2", value, array);

        if (array.indexOf(value) === -1) {
          throw new qx.core.ValidationError("Validation Error", message);
        }
      }
    },


    /**
     * Returns a function that checks if the given value fits the RegExp.
     * For testing, the function uses the RegExp.test function.
     * If the value given to the returned function does not fit the RegExp, a
     * ValidationError will be thrown.
     * incoming
     * @param reg {RegExp} The RegExp for the check.
     * @param errorMessage {String?null} Custom error message.
     * @return {Function} A function taking one parameter (value).
     */
    regExp : function(reg, errorMessage)
    {
      return function(value)
      {
        var message = errorMessage ||
          qx.locale.Manager.tr("%1 does not fit %2.", value, reg);

        if (!reg.test(value)) {
          throw new qx.core.ValidationError("Validation Error", message);
        }
      }
    }
  }
});/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
   * Sebastian Werner (wpbasti)
   * Andreas Ecker (ecker)

************************************************************************* */

/**
 * The modern font theme.
 */
qx.Theme.define("qx.theme.modern.Font",
{
  fonts :
  {
    "default" :
    {
      size : (qx.core.Environment.get("os.name") == "win" &&
        (qx.core.Environment.get("os.version") == "7" ||
        qx.core.Environment.get("os.version") == "vista")) ? 12 : 11,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Grande" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Segoe UI", "Candara" ] :
        [ "Tahoma", "Liberation Sans", "Arial", "sans-serif" ]
    },

    "bold" :
    {
      size : (qx.core.Environment.get("os.name") == "win" &&
        (qx.core.Environment.get("os.version") == "7" ||
        qx.core.Environment.get("os.version") == "vista")) ? 12 : 11,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Grande" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Segoe UI", "Candara" ] :
        [ "Tahoma", "Liberation Sans", "Arial", "sans-serif" ],
      bold : true
    },

    "small" :
    {
      size : (qx.core.Environment.get("os.name") == "win" &&
        (qx.core.Environment.get("os.version") == "7" ||
        qx.core.Environment.get("os.version") == "vista")) ? 11 : 10,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Grande" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Segoe UI", "Candara" ] :
        [ "Tahoma", "Liberation Sans", "Arial", "sans-serif" ]
    },

    "monospace" :
    {
      size: 11,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Console", "Monaco" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Consolas" ] :
        [ "Consolas", "DejaVu Sans Mono", "Courier New", "monospace" ]
    }
  }
});