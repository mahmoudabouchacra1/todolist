const elms=
{
 taskName:document.getElementById("taskName"),
 taskInput:document.getElementById("taskInput"),
 addTaskButton:document.getElementById("addTaskButton"),
 editTaskButton:document.getElementById("editTaskButton"),
 deleteTaskButton:document.getElementById("deleteTaskButton"),
 taskContainer:document.getElementById("taskContainer"),
};
let selctedTask=null;
function addtask()
{
  const taskName=elms.taskName.value.trim();
  const taskInput=elms.taskInput.value.trim();
  if(taskName===""||taskInput==="")
  {
    alert("pls fill in both fields")
    return;
  }
  const taskdiv=document.createElement("div");
  taskdiv.className="task";
  taskdiv.textContent=taskName+" _ "+taskInput;
  elms.taskContainer.appendChild(taskdiv);
  elms.taskName.value="";
  elms.taskInput.value="";
}
elms.addTaskButton.addEventListener("click",addtask);
function deletetask()
{
  if(elms.taskContainer.children.length===0)
  {
    alert("nothing to delete")
    return;
  }

  elms.taskContainer.removeChild(elms.taskContainer.lastElementChild);
}
elms.deleteTaskButton.addEventListener("click",deletetask);
function edittask()
{
  const taskName=elms.taskName.value.trim();
  const taskInput=elms.taskInput.value.trim();
   if(taskName===""||taskInput==="")
  {
    alert("pls fill in both fields")
    return;
  }
  
  if (elms.taskContainer.children.length === 0) {
    alert("No task to edit");
    return;
  }
  
  const lastTask = elms.taskContainer.lastElementChild;
  lastTask.textContent = taskName + " - " + taskInput;

  elms.taskName.value = "";
  elms.taskInput.value = "";
}
elms.editTaskButton.addEventListener("click",edittask)