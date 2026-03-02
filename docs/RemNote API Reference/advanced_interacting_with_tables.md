<!-- source: https://plugins.remnote.com/advanced/interacting_with_tables -->
<!-- crawled: 20260302_163700 -->

-   [](/)
-   Advanced
-   Tables

On this page

# Tables

If you want to see an example of a simple plugin which interacts with tables, please check out the [Autofill Tables plugin](https://github.com/remnoteio/remnote-official-plugins/tree/main/autofill-tables).

## Tags and Properties[​](#tags-and-properties "Direct link to heading")

Tables are built using tags and properties. Properties represent the columns in a table and they are stored as children of the tag. Each property has a type. You can see the available types in the `PropertyType` enum.

## Creating Tables[​](#creating-tables "Direct link to heading")

To create a table, you can use the `plugin.rem.createTable` method.

```codeBlockLines_HKiK
const tableRem = await plugin.rem.createTable(tagId);
```

## Interacting with Rows[​](#interacting-with-rows "Direct link to heading")

The rows of a table are simply Rem that have been tagged with the tag that is powering the table. You can use the `tableRem.taggedRem()` method to get all of the Rem that have been tagged with the table tag. Note that this returns all of the Rem that have been tagged with the table tag, not just the Rem that are in the table (which could be filtered).

```codeBlockLines_HKiK
const tag = ...const rows = await tag.taggedRem();
```

## Filtering Tables[​](#filtering-tables "Direct link to heading")

You can set the filter of a table by using the `tableRem.setTableFilter` method. The filter is a search query which can be created using the `Query` class. You can combine multiple query operators using the `Query.and`, `Query.or` and `Query.not` methods.

```codeBlockLines_HKiK
// Filter a table to show only Rem where the `column-id` column contains the text "hello" or "world".const tableRem = ...const query = Query.tableColumn('column-id', Query.or([  Query.text(TextMatcher.Contains, 'hello'),  Query.text(TextMatcher.Contains, 'world'),]));await tableRem.setTableFilter(query);
```

## Interacting with Properties[​](#interacting-with-properties "Direct link to heading")

### Get the Properties of a Tag[​](#get-the-properties-of-a-tag "Direct link to heading")

You can get the properties of a tag by getting the children of a tag and filtering them by whether or not they are properties.

```codeBlockLines_HKiK
const tag = ...const children = await tag.getChildrenRem();const properties = await filterAsync(children, c => c.isProperty());
```

### Add a Property[​](#add-a-property "Direct link to heading")

To add a property to a tag, you can set the parent of the property to the tag and set the text of the property to the name of the property.

```codeBlockLines_HKiK
const tagRem = ...const property = await plugin.rem.createRem();await property.setParent(tag._id)await property.setText(["New Property"]);await property.setIsProperty(true)
```

### Get and Set Cell Values[​](#get-and-set-cell-values "Direct link to heading")

You can get and set the value of a cell using the `row.getTagPropertyValue()` and `row.setTagPropertyValue()` methods.

```codeBlockLines_HKiK
const row = ...const property = ...const value = await row.getTagPropertyValue(property._id);await row.setTagPropertyValue(property._id, ["New Value"]);
```

### Get a Property's Type[​](#get-a-propertys-type "Direct link to heading")

You can see the available types in the `PropertyType` enum.

```codeBlockLines_HKiK
const property = ...const type = await property.getPropertyType();
```

### Adding Menu Buttons to the Table Property Menus[​](#adding-menu-buttons-to-the-table-property-menus "Direct link to heading")

You can add buttons to the configuration menu of table properties by using `plugin.app.registerMenuItem`. In the following example, the `rowIds` are the ids of the Rem that are currently shown in the table. The `columnPropertyId` is the id of the property that is being configured. The button will be shown in the configuration menu of all properties in the table.

```codeBlockLines_HKiK
await plugin.app.registerMenuItem({  id: 'id',  name: 'name',  location: PluginCommandMenuLocation.PropertyConfigMenu,  action: async (args: { rowIds: RemId[]; columnPropertyId: RemId }) => {    // ...  },});
```

![Table Button](/img/tutorials/table-button.png)