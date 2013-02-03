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

      var formProperties =
        [
          {
            name: "First column",
            elements:
            [{
              type:  "textfield",
              label: "Name",
              labelPosition: "top"
            }, {
              type: "radiobuttongroup",
              label: "Gender",
              labelPosition: "left",
              data: ["Male", "Female"]
            }, {
              type:  "textfield",
              label: "Last Name",
              labelPosition: "left"
            }, {
              type:  "textfield",
              label: "Country",
              labelPosition: "left"
            }, {
              type:  "textfield",
              label: "City",
              labelPosition: "left"
            }]
          },
          {
            name: "Second column",
            elements:
            [{
              type:  "textfield",
              label: "Additional information",
              labelPosition: "left"
            }, {
              type:  "textarea",
              label: "Bio",
              labelPosition: "left"
            }/*, {
              type: "singleselection",
              label: "single",
              labelPosition: "left",
              data: listData
            }*/]
          }
        ];

      var formGenerator = new formgenerator.FormGenerator(formProperties);
      this.getRoot().add(formGenerator, {top: 10, left:10});
    }
  }
});
