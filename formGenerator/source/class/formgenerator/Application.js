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

        Свойство widget - объект, определяющий стиль виджета, пример
        widget: {
          border:            {color: "black", width: 3, style: "solid"},
          options: {
            padding:         5,
            minHeight:       100,
            minWidth:        100,
            backgroundColor: "white"
          }
        }
        может отсутствовать, тогда применятся свойства по умолчанию

        items - массив объектов

        Каждый объект из массива items - характеризует одну колонку формы:
        Свойства объекта:
          name: - заголовок колонки,
            варианты name:
              1. какая-нибудь строка, например: "Main information"
              2. может отсутствовать, тогда заголовка не будет у колонки
          elements: - массив, определяющий элементы в колонке формы
            Каждый объект массива включает в себя:
              label: - текстовая метка
              Свойства label:
                name     - текст label
                position - позиция относительно элемента (слева или сверху)
                options  - доп. опции
              Некоторые примеры label:
                1. label: "Name" // //позиция по уолчанию будет left
                2. label: {name: "Name"} //позиция по уолчанию будет left
                3. label: {name: "Name", position: "top"}
                4. label: {name: "<b>Name</b>", position: "left", options: {color: "red", rich: true}} //с доп. опциями, например цвет
                5. может отсутствовать (тогда label не будет в форме)
                6. label: {} - аналогично п.5
              element: - элемент формы, определяет параметры элемента, вставляемого в форму
              Свойства element:
                type          - тип элемента формы
                value         - начальное значение
                data          - массив данных элемента (необходим, например, для группы Radio Button, или Selection List)
                                data обычно содержит либо просто строку, как элемент, например:
                                "First Item", тогда, например value для вновь создаваемого qx.ui.form.ListItem будет "First Item"
                                либо более правильный вариант:
                                {label: "First Item",   value: 1}

                                для multilist возможно указать несколько элементов в положение "выбран", для этого есть доп. свойство set
                                например:
                                {label: "First Item",    value: 1, set: true}
                                {label: "Second Item",   value: 2}
                                {label: "Third Item",    value: 3}
                                {label: "Fourth Item",   value: 4, set: true}
                                тогда будут выбраны первый и 4-й элементы

                propertyName  - имя свойства модели, с которым будет биндинг (!!! необязательно,если указан label, тогда имя свойства будет расчитывать из названия label)
                !!! Важно:
                имя свойства расчитывается либо на основе свойства prpertyName либо на основе имени метки,
                если имя метки содержит теги, или пробелы, они обрезаются с помощью регулярных выражений.
                options  - объект с различными парамертами, в нем можно, например ширину указать для элемента формы
                validate - объект для валидации,
                  свойства:
                  funct - ф-ция валидации

                  1. Для select, single/multi list, группы radio button первый параметр ф-ции валидации - сам элемент, и поэтому можно вытащить
                     значение выбранного селекта/list, например так: select.getSelection()[0].getModel()
                  2. Для checkbox group - первый параметр контейнер для чекбоксов, второй - массив чекбоксов
                  3. Для диапазона - первый параметр контейнер, может и не надо его исползовать, пользы особо никакой,
                     второй и третий параметры: //first - первый текстбокс, second - второй текстбокс

                     Добавлять сообщение о ошибке можно с помощью публичного метода addInvalidMessage, например:
                       this.addInvalidMessage("Single List: Please, dont choose 'Fifth item'");


                  4. Для остальных элементов можно указать либо стандартную ф-цию менеджера валидатора qooxdoo
                    т.е. что-то из
                      number
                      email
                      url
                      и.т.д.
                    либо свою кастомную ф-цию, например:

                    funct: function(value, item) {
                      if (value.length > 100) {
                        item.setInvalidMessage("Bio: No more than 100 characters, please");
                        return false;
                      }
                      return true;
                    }
                    так же для этих елементов доступно свойство errorMessage - которое задает тип сообщения

              Примеры element(только некоторые):
                1. может отсутствовать
                2. element: {} //аналогично п. 1
                3. element: {type: "textfield"} // если не указан label - элемент не появится на странице
                4. element: {type: "textfield", value: "Hello"}
                5. element: {type: "radiobuttongroup",  value: "Female", data: ["Male", "Female"]}

                ТАК ЖЕ:
                если будут указаны неверные данные, например:
                а) неизвестный тип элемента
                  element: {type: "superfield"}
                б) отсутствуют необходимые данные для radiobutton
                  element: {type: "radiobuttongroup",  value: "Female"}
                элемент создан не будет
          buttons - кнопки формы
            text     - текст кнопки
            callback - ф-ция обработчик кнопки
      */



      //Вариант для генерации формы № 1
      var formProperties = {
        widget: {
          border:  {color: "black", width: 3, style: "solid"},
          options: {
            padding:         5,
            minHeight:       100,
            minWidth:        100,
            backgroundColor: "white"
          }
        },
        items: [
          //1-я колонка
          {
            name: "First Column",
            elements: [
              {
                element: {type: "textfield",  propertyName: "firstName", value: "Ivan"},//!!если не укажем propertyName - он высчитается на основе label, в данном случае будет <b>First Name</b> после обработки -> FirstName
                label:   {name: "<b>First Name</b>", position: "top", options: {textColor: "red", rich: true}}
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
                element: {type: "radiobuttongroup", data: ["Unknown","Male", "Female"], propertyName: "gender", value: "Male", options: {width: 100},
                  validate: {
                    funct: function(radioButtonGroup) {
                      if (radioButtonGroup.getSelection()[0].getModel() == "Unknown") {
                        this.addInvalidMessage("Gender: Gender should not be Unknown");
                        return false;
                      }
                        return true;
                    }
                  }},
                label:   {name: "Gender", position: "left"}
              },
              //{
              //  element: {type: "radiobuttongroup", data: [{label: "label1", value: "Male"}, {label: "label2", value: "Female"}], propertyName: "gender2"},
              //  label:   {name: "Gender 2"}
              //},
              {
                element: {type: "textarea", propertyName: "bio", value: "I am cool guy!!! :)", validate: {
                  funct: function(value, item) {
                    if (value.length > 100) {
                      item.setInvalidMessage("Bio: No more than 100 characters, please");
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
                element: {type: "textfield", propertyName: "email", value: "example@email.com", validate: {funct: "email", errorMessage: "Email: Wrong email!!"}, options: {width: 150}},//email, стандартный валидатор
                label:   {name: "Email"}
              },
              {
                element: {type: "textfield", propertyName: "url", value: "http://site.com", validate: {funct: "url", errorMessage: "Your site: is not an url"}},//url стандартный валидатор
                label:   {name: "Your site"}
              },
              {
                element: {type: "textfield", propertyName: "personalNumber", value: "0", validate: {funct: "regExp", args: /^[\d]+$/, errorMessage: "Choose your number: Only numbers are allowed"}},//regExp стандартный валидатор
                label:   {name: "Choose your number"}
              },
              {
                element: {type: "textfield", propertyName: "req", value: "0", validate: {funct: "required", errorMessage: "Required field: this field is required"}},
                label:   {name: "Required field"}
              },
              {
                element: {type: "checkbox", value: 1, validate: {funct: "required", errorMessage: "Checkbox: this field is required"}},
                label:   {name: "Checkbox"}
              },
              //{
              //  element: {type: "textfield", propertyName: "group"},
              //  label:   {name: "Group"}
              //},
              {
                element: {type: "checkboxgroup",data: [{label: "a", value: 1}, {label: "b", value : 1}, {label: "c", value : 0}, {label: "d", value : 1}], propertyName: "group",
                validate: {
                  funct: function(checkboxesGroup ,checkboxes) {
                    if (checkboxes[0].getValue() && checkboxes[1].getValue() && !checkboxes[2].getValue()) {
                      return true;
                    } else {
                      this.addInvalidMessage("Group: Please set true for checkboxes 'a' and 'b', and set false for checkbox 'c'");
                      return false;
                    }
                  }
                }},
                label:   {name: "Group"}
              }
            ]
          },
          //4 колонка
          {
            name: "Fourth column",
            elements: [
              {
                element: {type: "select", propertyName: "selectGender", data: [{label: "--Select--", value: "--Select--"},"Male", {label: "Female", value: "Female"}, {label: "Unknown", value: "Unknown"}], value: "Male", validate: {
                  funct: function(select) {
                    if (select.getSelection()[0].getModel() == "--Select--") {
                      this.addInvalidMessage("Gender Select: Please select another value (not --Select--)");
                      return false;
                    }
                      return true;
                    }
                }},
                label:   {name: "Gender"}
              },
              {
                element: {type: "singlelist", propertyName: "singleList", data: [
                  {label: "First Item",   value: 1},
                  {label: "Second Item",  value: 2},
                  {label: "Third Item",   value: 3},
                  {label: "Fourth Item",  value: 4},
                  {label: "Fifth Item",   value: 5},
                  {label: "Sixth Item",   value: 6},
                  {label: "Seventh Item", value: 7},
                  {label: "Eighth Item",  value: 8},
                  {label: "Ninth Item",   value: 9}
                ],
                validate: {
                  funct: function(list) {
                    if (list.getSelection()[0].getModel() == 5) {
                      this.addInvalidMessage("Single List: Please, dont choose 'Fifth item'");
                      return false;
                    }
                      return true;
                    }
                }},
                label: {name: "Single List"}
              },
              {
                element: {type: "singlelist", propertyName: "singleList2", value: "Fifth Item" ,data: [
                  "First Item",
                  "Second Item",
                  "Third Item",
                  "Fourth Item",
                  "Fifth Item",
                  "Sixth Item",
                  "Seventh Item",
                  "Eighth Item",
                  "Ninth Item"
                ]},
                label: {name: "Single List 2"}
              },
              {
                label:   {name: "Label without Item"}
              }
            ]
          },
          //5 колонка
          {
            name: "Fifth column",
            elements: [
              {
                element: {type: "multilist", propertyName: "multiList", data: [
                  {label: "First Item",   value: 1},
                  {label: "Second Item",  value: 2},
                  {label: "Third Item",   value: 3},
                  {label: "Fourth Item",  value: 4},
                  {label: "Fifth Item",   value: 5},
                  {label: "Sixth Item",   value: 6},
                  {label: "Seventh Item", value: 7},
                  {label: "Eighth Item",  value: 8},
                  {label: "Ninth Item",   value: 9}
                ],
                validate: {
                  //например не хотим, чтобы был выбран элемент 2 или 3
                  funct: function(list) {
                    var selection = list.getSelection();
                    for (var i = 0; i < selection.length; i++) {
                      if (selection[i].getModel() == 2 || selection[i].getModel() == 3) {
                        this.addInvalidMessage("Multiple List: Don't choose Second or Third item");
                        return false;
                      }
                    }
                        return true;
                    }
                }
              },
                label: {name: "multipleLabel"}
              },
              {
                element: {type: "range", propertyName: "rangeProperty", data: [50, 55],
                validate: {
                  //хотим диапазон от 50 до 100
                  //element - контейнер, может и не надо его исползовать
                  //first - первый текстбокс, second - второй текстбокс
                  funct: function(element, first, second) {
                    var firstVal  = parseInt(first.getValue(), 10);
                    var secondVal = parseInt(second.getValue(), 10);
                    if (firstVal >= 0 && firstVal <= 50 && secondVal > 50 && secondVal <= 100 ) {
                      return true;
                    }
                    this.addInvalidMessage("Range: firstVal must be >= 0 and <= 50, second val must be > 50 and <= 100");
                    return false;
                  }
                }
              },
                label:   {name: "range label"}
              },
              {
                element: {type: "textfield", propertyName: "withoutLabelElement"}
              }
            ]
          }
        ],
        buttons: [
          //this в callback - это объект FormGenerator
          {text: "Save",   callback: function() {
            if (this.getManager().validate()) {
              alert("You are saving: " + qx.util.Serializer.toJson(this.getModel()));
            } else {
              alert(this.getManager().getInvalidMessages().join("\n"));
              //alert('WROOONG!!! :)');
            }

          }},
          {text: "Cancel", callback: function() {alert("Cancel");}}
        ]
      };




      /*
      //Вариант данных для генерации формы № 2. - всякие "плохие" варианты определения формы
      var formProperties = {
        items:
          [
            {
              //нет name => не будет названия у колонки
              elements:
              [{
                //Нет label, свойство для связи с моделью обязательно нужно указывать, иначе элемент не будет создан
                element: {type: "textfield", propertyName: "property1", value: 0}
              },  {
                //свойство модели рассчитано на основе label - будет LastName, плохое начальное значение, будет проигнорированно, будет присвоен null
                element: {type: "textfield", value: {}},
                label:   {name: "Last Name", position: "top"}
              }, {
                //"плохо" определенный label, но создастся, своство модели будет - Country
                element: {type: "textfield"},
                label:   "Country"
              }, {
                //label с options, свойство модели - City (теги и пробелы обрезаются)
                element: {type: "textfield"},
                label:   {name: "<b>City</b>", options: {textColor: "red", rich: true}}
              }, {
                //элемент с неизвестным типом, не создастся
                element: {type: "abracadabra"},
                label:   {name: "simple label"}
              }, {
                //т.к. неправильно определен label, и нет свойства propertyName - мы не можем определить свойство модели => элемент создан не будет
                element: {type: "textfield"},
                label:   {name111: "fff"}//неправильный label, с непонятным свойством
              }, {
                //радиогруппа с неправильным свойством data не отобразится
                element: {type: "radiobuttongroup", data: {}},
                label:   "wrong radiogroup"
              }, {
                //здесь и textfield и lastlabel "плохо определены", но все равно будут созданы, т.к. мы можем определить имя свойства на основе label
                element: "textfield",
                label:   "lastLabel"
              }, {
                //нет label и не указано свойство propertyName => не получается создать элемент
                element: "textfield"
              }, {
                //пустой label
                label: "Bla bla bla"
              }]
          },
          {
            name: "Second column",
            elements:
            [{
              //здесь все ок, хотя определение "плохое"
              element: "textfield",
              label:   "Additional information"
            }, {
              //ВНИМАНИЕ !!!!!!!  => здесь так как свойство lastLabel уже есть в модели, элемент создан не будет!!!!!!!!!
              //будет создан только label
              element: "textfield",
              label:   "lastLabel"
            },
            {
              //селект с лишним свойством bambambam, оно ни на что не влияет, и с нормальным свойством data
              //value указан null => будет проигнорирован
              //!!! с null и undefined в свойстве data поступаем просто - удаляем их из массива
              element: {type: "select", data: [null, 0, undefined, 1, 2, 3, 4, 5], bambambam: 123, value: null},
              label: {name: "Select1", position: "left"}//позиция и так по умолчанию left, здесь просто подтвердили это
            },
            {
              //селект с лишним свойством bambambam, оно ни на что не влияет, и с нормальным свойством data
              //функцию в строку преобразит, null и undefined срежет
              element: {type: "select", data: [0, 1, 3, 4, 5, function() {}, undefined, null]},
              label: {name: "Select2", position: "left"}//позиция и так по умолчанию left, здесь просто подтвердили это
            },
            {
              //singlelist неправильное свойство data
              element: {type: "singlelist", data: [null, undefined, null, null]},
              label:   {name: "wrong list1"}
            },
            {
              //***************************************
              //***************************************
              //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
              //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
              //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
              //Это вообще жуткий single list, но он будет создан
              //Значения, которые он может принимать:

              //one
              //two
              //3
              //4
              //fiivvve
              //45
              //function() {alert("dsad")}
              //i go go
              element: {
              type: "singlelist",
              data: [
                {label: "one"},
                "two",
                3,
                null,
                4,
                {label: "five", value: "fiivvve"},
                undefined,
                45,
                function() {alert("dsad")},
                {value: "i go go"}
              ],
              value: null
            },
            label: "TERRIBLE SINGLELIST"
            }
            ]
          }],
        buttons: [
          {text: "Save",   callback: function() {console.log("You are saving: " + qx.util.Serializer.toJson(this.getModel()));}},
          {text: "Cancel", callback: function() {console.log("Cancel");}}
        ]
      };
      */
      var formGenerator = new formgenerator.FormGenerator(formProperties);
      this.getRoot().add(formGenerator, {top: 10, left:10});

    }
  }
});



