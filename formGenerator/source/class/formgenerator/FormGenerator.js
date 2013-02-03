qx.Class.define("formgenerator.FormGenerator",
{
  extend : qx.ui.core.Widget,
  construct : function(options) {
  	//console.log(options);

  	this.base(arguments);

    //установили менеджер разметки
  	var layout = new qx.ui.layout.Grid(10, 10);
  	this._setLayout(layout);

    //добавляем дочерние виджеты
    for (var i = 0; i < options.length; i++) {
      //нам нужно установить менеджер раскладки, и иметь публичные методы для управления дочерними виджетами
      //поэтому будем использовать Composite вместо обычного виджета
      var child = new qx.ui.container.Composite();
      child.setLayout(new qx.ui.layout.Grid(15, 15));

      this._add(child, {row: 0, column: i});

      console.log(options[i].elements);

      var row = 0;

      //если есть заголовок, создадим его
      if (options[i].name) {
        var label = new qx.ui.basic.Label().set({
          value: "<b>" + options[i].name + "</b>",
          rich: true
        });
        child.add(label, {row: row, column: 0})
        row++;
      }

      var element = null;
      for (var j = 0; j < options[i].elements.length; j++) {
        var element = this._createElement(options[i].elements[j]);
        var label   = new qx.ui.basic.Label(options[i].elements[j].label);
        child.add(label, {row: row, column: 0});
        child.add(element, {row: row, column: 1});
        row++;
      }
    }

  	var borderColor = 'black';
    var border = new qx.ui.decoration.Single(3, "solid", borderColor);
    this.set({decorator: border, padding: 5, minHeight: 100, minWidth: 100});
  },
  members: {
    _createElement: function(options) {
      var element = null;
      switch (options.type) {
        case "textfield":
          element = this._createTextField();
          break;
        case "textarea":
          element = this._createTextArea();
          break;
        case "radiobuttongroup":
          element = this._createRadioButtonGroup(options.data);
          break;
      }
      return element;
    },
    _createTextField: function() {
      return new qx.ui.form.TextField();
    },
    _createTextArea:  function() {
      return new qx.ui.form.TextArea();
    },
    _createRadioButtonGroup: function(options) {
      var radioGroup = new qx.ui.form.RadioButtonGroup();
      for (var i = 0; i < options.length; i++) {
        radioGroup.add(new qx.ui.form.RadioButton(options[i]));
      }
      return radioGroup;
    }
  }
});