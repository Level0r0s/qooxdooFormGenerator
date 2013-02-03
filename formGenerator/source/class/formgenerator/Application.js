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
              }]
          },
          {
            name: "Second column",
            elements:
            [{
              element:  "textfield",
              label: "Additional information"
            }, {
              element:  "textarea",
              label: "Bio"
            }]
          }
        ]
      };

      var formGenerator = new formgenerator.FormGenerator(formProperties);
      this.getRoot().add(formGenerator, {top: 10, left:10});
    }
  }
});
