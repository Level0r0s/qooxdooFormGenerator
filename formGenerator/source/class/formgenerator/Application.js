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
            },/* {
              type: "radiobuttongroup",
              label: "Gender",
              labelPosition: "left",
              data: ["Male", "Female"]
            },*/ {
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
