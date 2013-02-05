qx.Class.define("formgenerator.FormGenerator",
{
  extend : qx.ui.core.Widget,
  construct : function(options) {
  	//console.log(options);

  	this.base(arguments);

    //установили менеджер разметки
  	var layout = new qx.ui.layout.Grid(10, 10);
  	this._setLayout(layout);

    var items   = options.items;
    var buttons = options.buttons;

    //создадим модель
    this._createModel(options);

    //добавляем дочерние виджеты
    for (var i = 0; i < items.length; i++) {
      //нам нужно установить менеджер раскладки, и иметь публичные методы для управления дочерними виджетами
      //поэтому будем использовать Composite вместо обычного виджета
      var child = new qx.ui.container.Composite();
      child.setLayout(new qx.ui.layout.Grid(15, 15));

      this._add(child, {row: 0, column: i});

      var row = 0;

      //если есть заголовок, создадим его
      if (items[i].name) {
        var label = new qx.ui.basic.Label().set({
          value: "<b>" + items[i].name + "</b>",
          rich: true
        });
        child.add(label, {row: row, column: 0})
        row++;
      }

      for (var j = 0; j < items[i].elements.length; j++) {
        var currentOption = items[i].elements[j];

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
            //Здесь сделаем binding с моделью внутри _createElement
            var element = this._createElement(currentOption);
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

    //Добавим кнопки
    if (buttons.length) {
      child = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));
      for (var i = 0; i < buttons.length; i++) {
        var button = new qx.ui.form.Button(buttons[i].text);
        button.addListener("execute", buttons[i].callback, this);
        child.add(button);
      }
      this._add(child, {row: 1, column: 0, colSpan: 2});
    }

  	var borderColor = 'black';
    var border = new qx.ui.decoration.Single(3, "solid", borderColor);
    this.set({decorator: border, padding: 5, minHeight: 100, minWidth: 100});
  },
  members: {
    //создание модели с данными из формы
    _createModel: function(options) {
      var items   = options.items;

      var modelSkeleton = {};
      for (var i = 0; i < items.length; i++) {
        for (var j = 0; j < items[i].elements.length; j++) {
          var currentOption = items[i].elements[j];

          var propertyName  = null;
          var propertyValue = null;
          var type          = null;

          //Сначала определим propertyName:
          //если есть propertyName, устанавливаем его в макет будущей модели
          if (currentOption.element && currentOption.element.propertyName) {
            propertyName = currentOption.element.propertyName;
          }
          //иначе пытаемся сгенерить на основе label
          else if (currentOption.label) {
            if (currentOption.label.name) {
              propertyName = currentOption.label.name;
              propertyName = propertyName.replace(/<\/?[^>]+>/g,'');
              propertyName = propertyName.replace(/\s/g, '');
            } else if (typeof currentOption.label == "string") {
              propertyName = currentOption.label;
              propertyName = propertyName.replace(/<\/?[^>]+>/g,'');
              propertyName = propertyName.replace(/\s/g, '');
            }
          }

          //теперь, если свойство propertyName есть -> пытаемся сгенерить начальное значение для этого property на основе типа элемента
          if (propertyName && currentOption.element) {
            //определим тип элемента, пытаемся определить тип элемента
            if (currentOption.element.type) {
              type = currentOption.element.type;
            }
            else {
              if (typeof currentOption.element == "string") {
                type = currentOption.element;
              }
            }
            switch (type) {
              case "textfield":
                //по умолчанию будет null
                modelSkeleton[propertyName] = propertyValue;
                break;
              case "textarea":
                //по умолчанию будет null
                modelSkeleton[propertyName] = propertyValue;
                break;
              case "radiobuttongroup":
                var toClass = {}.toString;
                if (currentOption.element.data && toClass.call(currentOption.element.data) == "[object Array]" && currentOption.element.data.length) {
                  //по умолчанию первый из списка
                  modelSkeleton[propertyName] = currentOption.element.data[0];
                }
                break;
            }
          }
        }
      }
      this._model = qx.data.marshal.Json.createModel(modelSkeleton);
    },
    _model: null,
    _inArray: function in_array(needle, haystack, strict) { // Checks if a value exists in an array
      // + original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      var found = false, key, strict = !!strict;
        for (key in haystack) {
          if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
            found = true;
            break;
          }
        }
        return found;
    },
    _modelProperties: [],//нужен, чтобы исключить биндинг двух элементов с одинаковым label на одну модель, т.е. в такой "плохой" ситуации забиндится только первый элемент
    _createElement: function(options) {
      var propertyName = null;
      //Сначала определим propertyName:
      //если есть propertyName, устанавливаем его в макет будущей модели
      if (options.element && options.element.propertyName) {
        propertyName = options.element.propertyName;
      }
      //иначе пытаемся сгенерить на основе label
      else if (options.label) {
        if (options.label.name) {
          propertyName = options.label.name;
          propertyName = propertyName.replace(/<\/?[^>]+>/g,'');
          propertyName = propertyName.replace(/\s/g, '');
        } else if (typeof options.label == "string") {
          propertyName = options.label;
          propertyName = propertyName.replace(/<\/?[^>]+>/g,'');
          propertyName = propertyName.replace(/\s/g, '');
        }
      }

      //определим тип элемента
      if (options.element.type) {
        var type = options.element.type;
      }
      else {
        if (typeof options.element == "string") {
          var type = options.element;
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
          //binding с контроллером:
          if (!this._inArray(propertyName, this._modelProperties)) {
            element.bind("value", this._model, propertyName);
            this._model.bind(propertyName, element, "value");
            this._modelProperties.push(propertyName);
          }
          break;
        case "textarea":
          element = this._createTextArea();
          //binding с контроллером:
          if (!this._inArray(propertyName, this._modelProperties)) {
            element.bind("value", this._model, propertyName);
            this._model.bind(propertyName, element, "value");
            this._modelProperties.push(propertyName);
          }
          break;
        case "radiobuttongroup":
          //радиогруппа требует data
          //проведем проверку, что options.data, если существует - то это массив

          //лучше проверить не через instanceof все таки, а одолжив toString метод
          //if (options.data && options.data instanceof Array && options.data.length) {
          //  element = this._createRadioButtonGroup(options.data);
          //}

          var toClass = {}.toString;
          if (options.element.data && toClass.call(options.element.data) == "[object Array]" && options.element.data.length) {
            element = this._createRadioButtonGroup(options.element.data);

            //биндинг
            element.bind("modelSelection[0]", this._model, propertyName)
            this._model.bind(propertyName, element, "modelSelection[0]");
            this._model.set(propertyName, "Female");
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
        var radioButton = new qx.ui.form.RadioButton(options[i]);
        radioButton.setModel(options[i]);
        radioGroup.add(radioButton);
      }
      return radioGroup;
    }
  }
});