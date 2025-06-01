
async function testTasksAPI() {
  console.log("Testing Tasks API...");
  
  // Create a test task
  const createResponse = await fetch('http://localhost:3000/api/crm/tasks', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      title: 'Test Task',
      description: 'This is a test task',
      status: 'pending',
      priority: 'medium',
      due_date: '2025-06-15',
      assigned_to: 'Test User'
    })
  });
  
  const createdTask = await createResponse.json();
  console.log('Created task:', createdTask);
  
  // Get the created task
  const getResponse = await fetch(`http://localhost:3000/api/crm/tasks/${createdTask.id}`);
  const fetchedTask = await getResponse.json();
  console.log('Fetched task:', fetchedTask);
  
  // Update the task
  const updateResponse = await fetch(`http://localhost:3000/api/crm/tasks/${createdTask.id}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      status: 'in_progress',
      assigned_to: 'Updated User'
    })
  });
  
  const updatedTask = await updateResponse.json();
  console.log('Updated task:', updatedTask);
  
  // Get all tasks
  const getAllResponse = await fetch('http://localhost:3000/api/crm/tasks');
  const allTasks = await getAllResponse.json();
  console.log('All tasks:', allTasks);
}

testTasksAPI().catch(console.error);
