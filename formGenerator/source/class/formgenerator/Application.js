/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(formgenerator/*)

************************************************************************ */

/**
 * This is the main application class of your custom application "formGenerator"
 */
qx.Class.define("formgenerator.Application",
{
  extend : qx.application.Standalone,

  members :
  {
    main: function()
    {
      this.base(arguments);

      /*
        Создадим объект со свойствами, которые будут определять форму:


        Каждый объект - характеризует одну колонку формы:
        Свойства объекта:
          name: - заголовок колонки,
          варианты name:
            1. "Main information"
            2. может отсутствовать, тогда заголовка не будет у колонки
          elements: - массив, определяющий элементы в колонке формы
            Каждый объект массива включает в себя:
              label: - текстовая метка
              Свойства label:
                name     - текст label
                position - позиция относительно элемента (слева или сверху)
                options  - доп. опции
              Варианты label:
                1. label: "Name" // //позиция по уолчанию будет left
                2. label: {name: "Name"} //позиция по уолчанию будет left
                3. label: {name: "Name", position: "top"}
                4. label: {name: "Name", position: "left", options: {color: "red"}} //с доп. опциями, например цвет
                5. может отсутствовать (тогда label не будет в форме)
                6. label: {} - аналогично п.5
              element: - элемент формы, определяет параметры элемента, вставляемого в форму
              Свойства element:
                type     - тип элемента формы
                value    - начальное значение
                data     - массив данных элемента (необходим, например, для группы Radio Button, или Selection List)
              Варианты element:
                1. может отсутствовать
                2. element: {} //аналогично п. 1
                3. element: {type: "textfield"}
                4. element: {type: "textfield", value: "Hello"}
                5. element: {type: "radiobuttongroup",  value: "Female", data: ["Male", "Female"]}

                если будут указаны неверные данные, например:
                а) неизвестный тип элемента
                  element: {type: "superfield"}
                б) отсутствуют необходимые данные для radiobutton
                  element: {type: "radiobuttongroup",  value: "Female"}
                элемент создан не будет
      */




      /*
      //Вариант данных для генерации формы № 1.
      //массив для single selection list
      var listData = [];
      for (var i = 0; i < 25; i++) {
        listData.push("Item No " + i);
      }

      var formProperties = {
        items:
          [
            {
              elements:
              [{
                element: {type: "textfield", propertyName: "property1"}//т.к. нет Label свойство для связи с моделью обязательно нужно указывать
              }, {
                element: {type: "radiobuttongroup", data: ["Male", "Female"]},//нормально определенный элемент, свойство модели - gender
                label:   {name: "Gender", position: "left"}
              }, {
                element: {type: "textfield"},
                label:   {name: "Last Name", position: "top"}//свойство модели - будет LastName
              }, {
                element: {type: "textfield"},
                label:   "Country"//"плохо" определенный label, своство модели будет - Country
              }, {
                element: {type: "textfield"},
                label:   {name: "<b>City</b>", options: {textColor: "red", rich: true}}//label с options, свойство модели - City (теги и пробелы обрезаются)
              }, {
                element: {type: "abracadabra"},//элемент с неизвестным типом, не создастся
                label:   {name: "simple label"}//свойство модели - simplelabel
              }, {
                element: {type: "textfield"},//т.к. неправильно определен label, и нет свойства propertyName - мы не можем определить свойство модели => элемент создан не будет
                label:   {name111: "fff"}//неправильный label, с непонятным свойством
              }, {
                element: {type: "radiobuttongroup", data: {}},//радиогруппа с неправильным свойством data не отобразится
                label:   "wrong radiogroup"
              }, {
                element: "textfield",
                label:   "lastLabel"
              }, {
                element: "textfield"//нет label и не указано свойство propertyName => не получается создать элемент
              }, {
                label: "sync_master"
              }]
          },
          {
            name: "Second column",
            elements:
            [{
              element: "textfield",
              label:   "Additional information"
            }, {
              element: "textarea",
              label:   "Bio"
            }, {
              element: "textfield",
              label:   "lastLabel"//перезапишется property модели
            }]
          }],
        buttons: [
          {text: "Save",   callback: function() {alert("You are saving: " + qx.util.Serializer.toJson(this._model));}},
          {text: "Cancel", callback: function() {alert("Cancel");}}
        ]
      };
      */

      //Вариант для генерации формы № 2
      var formProperties = {
        items: [
          //1-я колонка
          {
            name: "First Column",
            elements: [
              {
                element: {type: "textfield",  propertyName: "firstName", value: "Ivan"},
                label:   {name: "First Name", position: "top", options: {textColor: "red", rich: true}}
              },
              {
                element: {type: "textfield", propertyName: "lastName", value: "Golubev"},
                label:   {name: "Last Name", position: "top"}
              }
            ]
          },
          //2-я колонка
          {
            name: "Second Column",
            elements: [
              {
                element: {type: "radiobuttongroup", data: ["Male", "Female"], propertyName: "gender", value: "Female", options: {width: 100}},
                label:   {name: "Gender", position: "left"}
              },
              {
                element: {type: "textarea", propertyName: "bio", value: "I am cool guy!!! :)", validate: {funct: function(value, item) {
                  if (value.length > 100) {
                    item.setInvalidMessage("No more than 100 characters, please");
                    return false;
                  }
                  return true;
                }}},
                label:   {name: "Bio"}
              }
            ]
          },
          //3-я колонка
          {
            name: "Third Column",
            elements: [
              {
                element: {type: "textfield", propertyName: "email", value: "example@email.com", validate: {funct: "email", errorMessage: "Wrong email!!"}, options: {width: 150}},//email, стандартный валидатор
                label:   {name: "Email"}
              },
              {
                element: {type: "textfield", propertyName: "url", value: "http://site.com", validate: {funct: "url"}},//url стандартный валидатор
                label:   {name: "Your site"}
              },
              {
                element: {type: "textfield", propertyName: "personalNumber", value: "0", validate: {funct: "regExp", args: /^[\d]+$/, errorMessage: "Only numbers are allowed"}},//regExp стандартный валидатор
                label:   {name: "Choose your number"}
              },
              {
                element: {type: "textfield", propertyName: "req", value: "0", validate: {funct: "required"}},
                label:   {name: "Required field"}
              },
              {
                element: {type: "checkbox", value: 1, validate: {funct: "required"}},
                label:   {name: "Checkbox"}
              },
              //{
              //  element: {type: "textfield", propertyName: "group"},
              //  label:   {name: "Group"}
              //},
              {
                element: {type: "checkboxgroup", data: [{label: "a", value: 0}, {label: "b", value : 1}, {label: "c", value : 1}, {label: "d", value : 1}], propertyName: "group",
                validate: {
                  funct: function(checkboxes, formItems) {
                    if (checkboxes[0].getValue() && checkboxes[1].getValue()) {
                      return true;
                    }
                      return false;
                    }
                  }
                },
                label:   {name: "Group"}
              }
            ]
          },
          //4 колонка
          {
            name: "Fourth column",
            elements: [
              {
                element: {type: "select", propertyName: "selectGender", data: ["--Select--","Male", "Female", "Unknown"], validate: {
                  //чекбоксы можно получить через массив children
                  funct: function(children) {
                    console.log('arguments:');
                    console.log(arguments);
                    if (children[0].getValue() && children[1].getValue()) {
                      return true;
                    }
                      return false;
                    }
                }},
                label:   {name: "Gender"}
              }
            ]
          }
        ],
        buttons: [
          {text: "Save",   callback: function() {
            if (this._manager.validate()) {
              alert("You are saving: " + qx.util.Serializer.toJson(this._model));
            } else {
              alert('WROOONG!!! :)');
            }

          }},
          {text: "Cancel", callback: function() {alert("Cancel");}}
        ]
      };

      var formGenerator = new formgenerator.FormGenerator(formProperties);
      this.getRoot().add(formGenerator, {top: 10, left:10});
    }
  }
});
