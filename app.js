const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todoListDB", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("item", itemsSchema);

const defaultItems = [
  {
    name: "Welcome to your todolist!"
  },
  {
    name: "Hit the + button to add a new item."
  },
  {
    name: "<-- Hit this to delete an item."
  }
];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

// Check and insert default items if they don't exist
async function insertDefaultItemsIfEmpty() {
  try {
    const count = await Item.countDocuments();
    if (count === 0) {
      await Item.insertMany(defaultItems);
      console.log("Default items inserted successfully.");
    }
  } catch (error) {
    console.log(error);
  }
}

insertDefaultItemsIfEmpty();

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  } catch (error) {
    console.log(error);
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName })
    .then(function (foundList) {

      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        console.log("saved");
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) { });
})

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log("Error: " + err);
      });
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    if (checkedItemId != undefined) {
      await Item.findByIdAndRemove(checkedItemId)
        .then(() => console.log(`Deleted ${checkedItemId} Successfully`))
        .catch((err) => console.log("Deletion Error: " + err));
      res.redirect("/");
    }
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(() => {
        console.log(`Deleted ${checkedItemId} from ${listName} Successfully`);
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log("Deletion Error: " + err);
        res.redirect("/" + listName); // Redirect even on error
      });
  }
});



app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});