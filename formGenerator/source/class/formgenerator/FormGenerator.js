qx.Class.define("formgenerator.FormGenerator",
{
  extend : qx.ui.core.Widget,
  construct : function(options) {
  	//console.log(options);

  	this.base(arguments);

    //установим менеджер разметки
  	var layout = new qx.ui.layout.Grid(10, 10);
  	this._setLayout(layout);

    //создадим модель
    this._createModel(options);

    //заполним форму элементами, и сделаем binding с моделью
    this._createFormItems(options);

    //создадим кнопки
    this._createButtons(options);

    //Затем займемся внешним видом
  	var borderColor = 'black';
    var border = new qx.ui.decoration.Single(3, "solid", borderColor);
    this.set({decorator: border, padding: 5, minHeight: 100, minWidth: 100, backgroundColor: "white"});
  },
  members: {
    //создание модели с данными из формы
    //значения по умолчанию, если они допустимы (например для радиогруппы возможно значение из дискретного набора), то они установятся значениями модели.
    _createModel: function(options) {
      var items   = options.items;
      var modelSkeleton = {};
      for (var i = 0; i < items.length; i++) {
        for (var j = 0; j < items[i].elements.length; j++) {

          var currentOption = items[i].elements[j];

          var propertyName  = null;
          var propertyValue = null;
          var type          = null;

          //Сначала попытаемся определить propertyName:
          propertyName = this._tryGetPropertyName(currentOption);

          //теперь, если свойство propertyName есть -> пытаемся сгенерить начальное значение для этого property на основе типа элемента
          if (propertyName && currentOption.element) {
            type = this._tryGetType(currentOption);
            switch (type) {
              case "textfield":
                //если есть дефолтное значение - устанавливаем его, иначе значение по умолчанию - null
                if (currentOption.element.value) {
                  propertyValue = currentOption.element.value;
                }
                modelSkeleton[propertyName] = propertyValue;
                break;
              case "textarea":
                //если есть дефолтное значение - устанавливаем его, иначе значение по умолчанию - null
                if (currentOption.element.value) {
                  propertyValue = currentOption.element.value;
                }
                modelSkeleton[propertyName] = propertyValue;
                break;
              case "radiobuttongroup":
                var toClass = {}.toString;
                if (currentOption.element.data && toClass.call(currentOption.element.data) == "[object Array]" && currentOption.element.data.length) {
                  if (currentOption.element.value && this._inArray(currentOption.element.value, currentOption.element.data)) {
                    propertyValue = currentOption.element.value;
                  } else {
                    propertyValue = currentOption.element.data[0];
                  }
                  //по умолчанию первый из списка
                  modelSkeleton[propertyName] = propertyValue;
                }
                break;
              case "checkbox":
                if (currentOption.element.value) //true , "true", 1 - сработают, правда и {} тоже отметит чекбокс
                {
                  propertyValue = 1;
                }
                modelSkeleton[propertyName] = propertyValue;
                break;
              case "checkboxgroup":
                if (currentOption.element.data && toClass.call(currentOption.element.data) == "[object Array]" && currentOption.element.data.length) {
                  propertyValue = [];
                  for (var k = 0; k < currentOption.element.data.length; k++) {
                    if (currentOption.element.data[k]) {
                      propertyValue.push(1);
                    }
                    else {
                      propertyValue.push(0);
                    }
                  }
                  console.log(propertyValue);
                  modelSkeleton[propertyName] = propertyValue;
                }
                break;
                //*************************** СЮДА НАДО ДОБАВЛЯТЬ КОД ПРИ ДОБАВЛЕНИИ НОВЫХ ЭЛЕМЕНТОВ ********************************
            }
          }
        }
      }

      this._model = qx.data.marshal.Json.createModel(modelSkeleton);
      this._controller = new qx.data.controller.Object(this._model);
    },
    _createFormItems: function(options) {
      //инициализируем валидатор
      this._manager = new qx.ui.form.validation.Manager();

      var items = options.items;
      //добавляем дочерние виджеты
      for (var i = 0; i < items.length; i++) {
        //нам нужно установить менеджер раскладки, и иметь публичные методы для управления дочерними виджетами
        //поэтому будем использовать Composite вместо обычного виджета
        var child = new qx.ui.container.Composite();
        child.setLayout(new qx.ui.layout.Grid(15, 15));
        this._add(child, {row: 0, column: i});

        //теперь, после того, как добавили колонку, начнем её заполнять
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

          //Пробуем добавить label
          //позиция label top, (если есть)
          var topPosition   = currentOption.label && currentOption.label.position && currentOption.label.position == "top";
          var labelName     = null;
          //если есть label в свойствах
          if (currentOption.label) {
            //указан ли label через объект, или нет
            if (currentOption.label.name) {
              labelName = currentOption.label.name;
            } else if (typeof currentOption.label == "string") {
              labelName = currentOption.label;
            }
            //если есть имя для label, создаем его
            if (labelName != null) {
              var label   = new qx.ui.basic.Label(labelName);
              //если есть option, установим их для label
              if (currentOption.label.options) {
                label.set(currentOption.label.options);
              }
              child.add(label, {row: row, column: 0});
              //если label над элементом
              if (topPosition) {
                row++;
              }
            }
          }

          //если есть свойство element  попробуем добавить элемент
          if (currentOption.element) {
            //если есть имя label или указан propertyName, то создаем элемент
            if (labelName != null || currentOption.element.propertyName) {
              //Внутри ф-ции создания элемента делается binding с моделью, если получается создать элемент
              var element = this._createElement(currentOption);

              //если все хорошо, применяем валидацию, если есть, и добавляем элемент
              if (element != null) {
                //Здесь блок валидации идет:
                if (currentOption.element.validate && currentOption.element.validate.funct) {
                  var validate = null;
                  //если свой валидатор:
                  if (typeof currentOption.element.validate.funct == "function") {
                    validate = currentOption.element.validate.funct;
                    this._manager.add(element, validate);
                  }
                  //иначе пробуем подобрать валидатор из готового набора
                  else if (typeof currentOption.element.validate.funct == "string") {
                    validate = this._tryComputeValidator(currentOption.element.validate);
                    if (validate) {
                      if (validate == "required") {
                        element.setRequired(true);
                        this._manager.add(element);
                      } else {
                        this._manager.add(element, validate);
                      }
                    }
                  }
                }

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
    },
    _model: null,
    _controller: null,
    _manager: null,
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
    _createButtons: function(options) {
      var buttons = options.buttons;
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
    },
    _modelProperties: [],//нужен, чтобы исключить биндинг двух элементов с одинаковым label на одну модель, т.е. в такой "плохой" ситуации забиндится только первый элемент
    _createElement: function(currentOption) {
      var propertyName = null;
      var type         = null;
      var element      = null;
      //пытаемся определить propertyName и type
      propertyName = this._tryGetPropertyName(currentOption);
      type         = this._tryGetType(currentOption);

      switch (type) {
        case "textfield":
          element = this._createTextField();
          //binding с контроллером:
          if (!this._inArray(propertyName, this._modelProperties)) {
            this._controller.addTarget(element, "value", propertyName, true);
            this._modelProperties.push(propertyName);
          }
          break;
        case "textarea":
          element = this._createTextArea();
          //binding с контроллером:
          if (!this._inArray(propertyName, this._modelProperties)) {
            this._controller.addTarget(element, "value", propertyName, true);
            this._modelProperties.push(propertyName);
          }
          break;
        case "radiobuttongroup":
          //радиогруппа требует data
          //проведем проверку, что currentOption.data, если существует - то это массив

          //лучше проверить не через instanceof все таки, а одолжив toString метод
          //if (currentOption.data && currentOption.data instanceof Array && currentOption.data.length) {
          //  element = this._createRadioButtonGroup(currentOption.data);
          //}

          var toClass = {}.toString;
          if (currentOption.element.data && toClass.call(currentOption.element.data) == "[object Array]" && currentOption.element.data.length) {
            element = this._createRadioButtonGroup(currentOption.element.data);
            //биндинг
            //element.bind("modelSelection[0]", this._model, propertyName)
            //this._model.bind(propertyName, element, "modelSelection[0]");
            if (!this._inArray(propertyName, this._modelProperties)) {
              this._controller.addTarget(element, "modelSelection[0]", propertyName, true);
              this._modelProperties.push(propertyName);
            }
          }

          break;
        case "checkbox":
          element = this._createCheckbox();
          if (!this._inArray(propertyName, this._modelProperties)) {
            var okModel2CheckBox = {converter: function(data) {
              return data === 1;
            }}
            var okCheckBox2Model = {converter: function(data) {
              return data ? 1 : 0;
            }}
            this._controller.addTarget(element, "value", propertyName, true, okModel2CheckBox, okCheckBox2Model);
            this._modelProperties.push(propertyName);
          }
          break;
        case "checkboxgroup":
          var toClass = {}.toString;
          if (currentOption.element.data && toClass.call(currentOption.element.data) == "[object Array]" && currentOption.element.data.length) {
            element = new qx.ui.groupbox.GroupBox();
            element.setLayout(new qx.ui.layout.VBox(10));
            if (!this._inArray(propertyName, this._modelProperties)) {
              for (var i = 0; i < currentOption.element.data.length; i++) {
                var checkbox = this._createCheckbox();
                console.log(checkbox);
                element.add(checkbox);
                var okModel2CheckBox = {converter: function(data) {
                   return data === 1;
                }}
                var okCheckBox2Model = {converter: function(data) {
                   return data ? 1 : 0;
                }}
                this._controller.addTarget(checkbox, "value", propertyName + "[" + i + "]", true, okModel2CheckBox, okCheckBox2Model);
              }
              this._modelProperties.push(propertyName);
            }
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
    _createCheckbox: function() {
      return new qx.ui.form.CheckBox();
    },
    _createRadioButtonGroup: function(data) {
      var radioGroup = new qx.ui.form.RadioButtonGroup();
      for (var i = 0; i < data.length; i++) {
        var radioButton = new qx.ui.form.RadioButton(data[i]);
        radioButton.setModel(data[i]);
        radioGroup.add(radioButton);
      }
      return radioGroup;
    },
    //метод пытается получить свойство name для элемента
    _tryGetPropertyName: function(currentOption) {
      var propertyName = null;
      //если есть propertyName, устанавливаем его в макет будущей модели
      if (currentOption.element && currentOption.element.propertyName) {
        propertyName = currentOption.element.propertyName;
      }
      //иначе пытаемся сгенерить на основе label
      else if (currentOption.label) {
        if (currentOption.label.name && typeof currentOption.label.name == "string") {
          propertyName = currentOption.label.name;
          propertyName = propertyName.replace(/<\/?[^>]+>/g,'');
          propertyName = propertyName.replace(/\s/g, '');
        } else if (typeof currentOption.label == "string") {
          propertyName = currentOption.label;
          propertyName = propertyName.replace(/<\/?[^>]+>/g,'');
          propertyName = propertyName.replace(/\s/g, '');
        }
      }
      return propertyName;
    },
    //метод пытается получить свойство type для элемента
    _tryGetType: function(currentOption) {
      var type = null;
      if (currentOption.element) {
        //определим тип элемента, пытаемся определить тип элемента
        if (currentOption.element.type && typeof currentOption.element.type == "string") {
          type = currentOption.element.type;
        }
        else {
          if (typeof currentOption.element == "string") {
            type = currentOption.element;
          }
        }
      }
      return type;
    },
    _tryComputeValidator: function(validator) {
      var funct = validator.funct;
      var args  = null;
      var errorMessage = null;
      //если есть доп. аргументы
      if (validator.args) {
        args = validator.args;
      }
      //если есть сообщение о ошибке
      if (validator.errorMessage) {
        errorMessage = validator.errorMessage;
      }
      //т.к. return, break не нужен
      switch(funct) {
        case "required":
          return "required";
        case "number"  :
          return qx.util.Validate.number(errorMessage);
        case "email"   :
          return qx.util.Validate.email(errorMessage);
        case "string"  :
          return qx.util.Validate.string(errorMessage);
        case "url"     :
          return qx.util.Validate.url(errorMessage);
        case "color"   :
          return qx.util.Validate.color(errorMessage);
        case "range"   :
          if (args[0] && args[1]) {
            return qx.util.Validate.range(args[0], args[1], errorMessage);
          }
          return null;
        case "inArray":
          if (args) {
            return qx.util.Validate.inArray(args, errorMessage);
          }
          return null;
        case "regExp":
          if (args) {
            return qx.util.Validate.regExp(args, errorMessage);
          }
          return null;
        default:
          return null
      }
    }
  }
});