const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const format = require('date-fns/format')
const {isValid} = require('date-fns')

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializedatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000)
  } catch (error) {
    console.log(`Database show error ${error}`)
    process.exit(1)
  }
}
initializedatabase()

const checkQuery = (request, response, next) => {
  const {priority, status, category, dueDate} = request.query

  const priorityList = ['HIGH', 'MEDIUM', 'LOW']
  if (priority !== undefined) {
    const ispriority = priorityList.includes(priority)
    if (ispriority === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  }

  const categoryList = ['WORK', 'HOME', 'LEARNING']
  if (category !== undefined) {
    const iscatergory = categoryList.includes(category)
    if (iscatergory === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  }

  const statusList = ['TO DO', 'IN PROGRESS', 'DONE']
  if (status !== undefined) {
    const isstatus = statusList.includes(status)
    if (isstatus === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  }

  if (dueDate !== undefined) {
    const newDate = format(new Date(dueDate), 'yyyy-MM-dd')
    if (isValid(new Date(dueDate))){
      request.dueDate = newDate
    }
    else{
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
  next();
}

app.get('/todos/', checkQuery, async (request, response) => {
  const {status, priority, search_q = '', category} = request.query
  console.log(status)
  const querytodos = `
    SELECT id,todo,category,priority,status,due_date as dueDate
    FROM todo
    WHERE status='${status}' AND priority='${priority}' AND todo ='%${search_q}%' AND category = '${category}'`
  const resultquery = await db.all(querytodos)
  response.send(resultquery)
})

app.get('/todos/:todoId', checkQuery, async (request, response) => {
  const {todoId} = request.params
  const todoIdquery = `
    SELECT id,todo,category,priority,status,due_date as dueDate
    FROM todo
    WHERE id = ${todoId}`
  const resulttodoId = await db.get(todoIdquery)
  response.send(resulttodoId)
})

app.get('/agenda/',checkQuery,async (request,response)=>{
  const {dueDate} = request.query
  const todoDate = `
  SELECT id,todo,category,priority,status,due_date as dueDate
  FROM todo
  WHERE due_date = ${dueDate}`

  const resultDate = await db.all(todoDate);
  response.send(resultDate)
})

app.post('/todos/',checkQuery,async (request,response)=>{
  const {id,todo,category,priority,status,dueDate} = request.body
  const inserttodo = `
  INSERT INTO
    todo(id,todo,category,priority,status,due_date)
  VALUES(
    ${id},
    '${todo}',
    '${category}',
    '${priority}',
    '${status}',
    '${dueDate}'
  )`

  await db.run(inserttodo)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/',checkQuery,async (request,response)=>{
  const {todoId} = request.params
  const{category,priority,status,dueDate} = request.body

  switch(request.body){
    case (category!==undefined):
      let updatecate = `
        UPDATE todo
        SET category = '${category}'
        WHERE id = ${todoId}`
      await db.run(updatecate)
      response.send("Category Updated")
      break
    
    case (priority!==undefined):
      let updateprio = `
      UPDATE todo
      SET priority = '${priority}'
      WHERE id = ${todoId}`
      await db.run(updateprio)
      response.send("Priority Updated")
      break
    
    case (status!==undefined):
      let updatestatus = `
      UPDATE todo
      SET status = '${status}'
      WHERE id = ${todoId}`
      await db.run(updatestatus)
      response.send("Status Updated")
      break
    
    case (dueDate!==undefined):
      let updatedueDate = `
      UPDATE todo
      SET dueDate = '${dueDate}'
      WHERE id = ${todoId}`
      await db.run(updatedueDate)
      response.send("Due Date Updated")
      break
  }
})

app.delete('/todos/:todoId/',async (request,response)=>{
  const {todoId} = request.params
  const deleteTodoId = `
  DELETE FROM todo
  WHERE id = ${todoId}`
  await db.run(deleteTodoId)
  response.send("Todo Deleted")
})

module.exports = app
