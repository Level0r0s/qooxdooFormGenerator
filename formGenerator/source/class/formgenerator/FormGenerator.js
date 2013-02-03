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

      for (var j = 0; j < options[i].elements.length; j++) {
        var currentOption = options[i].elements[j];

        //позиция label top, (если есть)
        var topPosition   = currentOption.label && currentOption.label.position && currentOption.label.position == "top";

        //если есть label в свойствах
        if (currentOption.label) {
          //указан ли label через объект, или нет
          if (currentOption.label.name) {
            var labelName = currentOption.label.name;
          } else {
            if (typeof currentOption.label == "string") {
              var labelName = currentOption.label;
            } else {
              var labelName = null;
            }
          }

          if (labelName != null) {
            var label   = new qx.ui.basic.Label(labelName);
            //если есть option, установим их для label
            if (currentOption.label.options) {
              label.set(currentOption.label.options);
            }
            child.add(label, {row: row, column: 0});
            if (topPosition) {
              row++;
            }
          }
        } else {
          var labelName = null;
        }

        //если есть свойство element  попробуем добавить элемент
        if (currentOption.element) {
          //если есть имя label или указан propertyName, то создаем элемент
          if (labelName != null || currentOption.element.propertyName) {
            var element = this._createElement(currentOption.element);
            if (element != null) {
              if (topPosition) {
                child.add(element, {row: row, column: 0});
              }
              else {
                child.add(element, {row: row, column: 1});
              }
            }
          }
        }

        row++;
      }
    }

  	var borderColor = 'black';
    var border = new qx.ui.decoration.Single(3, "solid", borderColor);
    this.set({decorator: border, padding: 5, minHeight: 100, minWidth: 100});
  },
  members: {
    _createElement: function(options) {
      //определим тип элемента
      if (options.type) {
        var type = options.type;
      }
      else {
        if (typeof options == "string") {
          var type = options;
        }
      }
      //елси не получилось определить тип, возвращаем null (может стоит в этой функции использовать как то исключения, не знаю, потом посмотреть)
      if (!type) {
        return null;
      }

      var element = null;
      switch (type) {
        case "textfield":
          element = this._createTextField();
          break;
        case "textarea":
          element = this._createTextArea();
          break;
        case "radiobuttongroup":
          //радиогруппа требует data
          //проведем проверку, что options.data, если существует - то это массив

          //лучше проверить не через instanceof все таки, а одолжив toString метод
          //if (options.data && options.data instanceof Array && options.data.length) {
          //  element = this._createRadioButtonGroup(options.data);
          //}

          var toClass = {}.toString;
          if (options.data && toClass.call(options.data) == "[object Array]" && options.data.length) {
            element = this._createRadioButtonGroup(options.data);
          }
          else {
            element = null;
          }
          break;
        default:
          //если не получилось определить тип - возвращаем пусто
          element = null;
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