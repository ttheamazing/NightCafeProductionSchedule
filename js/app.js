document.addEventListener('DOMContentLoaded', () => {
    // Check if we have saved data
    const savedTasks = localStorage.getItem('gantt_scheduledTasks');
    const savedProducts = localStorage.getItem('gantt_products');
    const savedEmployees = localStorage.getItem('gantt_employees');
    
    console.log('Checking for saved data:');
    console.log('- Saved tasks:', savedTasks ? `Found (${JSON.parse(savedTasks).length} tasks)` : 'None');
    console.log('- Saved products:', savedProducts ? `Found (${JSON.parse(savedProducts).length} products)` : 'None');
    console.log('- Saved employees:', savedEmployees ? `Found (${JSON.parse(savedEmployees).length} employees)` : 'None');
    
    const hasSavedData = savedTasks || savedProducts || savedEmployees;
    
    // Initialize the Gantt chart with sample data or empty data if we have saved data
    let initialData;
    
    if (hasSavedData) {
        console.log('Using empty initial data because saved data was found');
        initialData = {
            employees: [],
            daySpecificEmployees: {},
            products: [],
            scheduledTasks: []
        };
    } else {
        console.log('Using sample data because no saved data was found');
        initialData = sampleData;
    }
    
    const ganttChart = new GanttChart(initialData);
    
    // Set current date to today
    const today = new Date();
    ganttChart.currentDate = today;
    
    // Get product modal elements
    const productModal = document.getElementById('product-modal');
    const closeProductModal = document.querySelector('.close-modal');
    const productNameInput = document.getElementById('product-name');
    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const saveProductBtn = document.getElementById('save-product-btn');
    const cancelProductBtn = document.getElementById('cancel-product-btn');
    
    // Get employee modal elements
    const employeeModal = document.getElementById('employee-modal');
    const closeEmployeeModal = document.querySelector('.close-employee-modal');
    const employeeNameInput = document.getElementById('employee-name');
    const saveEmployeeBtn = document.getElementById('save-employee-btn');
    const cancelEmployeeBtn = document.getElementById('cancel-employee-btn');
    
    let editingProductId = null;
    
    // Create header controls container
    const headerControls = document.createElement('div');
    headerControls.className = 'header-controls';
    document.querySelector('header').appendChild(headerControls);
    
    // Add a button to add a new employee
    const addEmployeeBtn = document.createElement('button');
    addEmployeeBtn.textContent = 'Add New Employee';
    addEmployeeBtn.className = 'add-employee-btn';
    headerControls.appendChild(addEmployeeBtn);
    
    // Add a button for templates
    const templateBtn = document.createElement('button');
    templateBtn.textContent = 'Day Templates';
    templateBtn.className = 'template-btn';
    headerControls.appendChild(templateBtn);
    
    // Add a hidden reset button (accessible via keyboard shortcut)
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset All Data';
    resetBtn.className = 'reset-btn';
    resetBtn.style.backgroundColor = '#dc3545';
    resetBtn.style.marginLeft = '10px';
    resetBtn.style.display = 'none'; // Hide the button
    headerControls.appendChild(resetBtn);
    
    // Add reset functionality via keyboard shortcut (Ctrl+Shift+R)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault(); // Prevent browser refresh
            if (confirm('This will reset all data including templates and scheduled tasks. Are you sure?')) {
                // Clear localStorage
                localStorage.clear();
                
                // Also clear any sample data tasks
                if (sampleData && sampleData.scheduledTasks) {
                    sampleData.scheduledTasks = [];
                }
                
                // Reload the page
                window.location.reload();
            }
        }
    });
    
    // Add print functionality
    document.getElementById('print-btn').addEventListener('click', () => {
        // Generate a print-friendly table view
        generatePrintView(ganttChart);
    });
    
    // Template functionality
    const templateModal = document.getElementById('template-modal');
    const closeTemplateModal = document.querySelector('.close-template-modal');
    const saveTemplateTab = document.getElementById('save-template-tab');
    const loadTemplateTab = document.getElementById('load-template-tab');
    const saveTemplatePanel = document.getElementById('save-template-panel');
    const loadTemplatePanel = document.getElementById('load-template-panel');
    const templateNameInput = document.getElementById('template-name');
    const dayToSaveSelect = document.getElementById('day-to-save');
    const templateToLoadSelect = document.getElementById('template-to-load');
    const dayToApplySelect = document.getElementById('day-to-apply');
    const saveTemplateBtn = document.getElementById('save-template-btn');
    const loadTemplateBtn = document.getElementById('load-template-btn');
    
    // Initialize templates array in localStorage if it doesn't exist
    if (!localStorage.getItem('dayTemplates')) {
        localStorage.setItem('dayTemplates', JSON.stringify([]));
    }
    
    // Open template modal
    templateBtn.addEventListener('click', () => {
        populateDaySelects();
        populateTemplateSelect();
        templateModal.style.display = 'block';
    });
    
    // Close template modal
    closeTemplateModal.addEventListener('click', () => {
        templateModal.style.display = 'none';
    });
    
    // Close template modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === templateModal) {
            templateModal.style.display = 'none';
        }
    });
    
    // Switch between save and load tabs
    saveTemplateTab.addEventListener('click', () => {
        saveTemplateTab.classList.add('active');
        loadTemplateTab.classList.remove('active');
        saveTemplatePanel.style.display = 'block';
        loadTemplatePanel.style.display = 'none';
    });
    
    loadTemplateTab.addEventListener('click', () => {
        loadTemplateTab.classList.add('active');
        saveTemplateTab.classList.remove('active');
        loadTemplatePanel.style.display = 'block';
        saveTemplatePanel.style.display = 'none';
    });
    
    // Save template
    saveTemplateBtn.addEventListener('click', () => {
        const templateName = templateNameInput.value.trim();
        if (!templateName) {
            alert('Please enter a template name');
            return;
        }
        
        // Get the selected day or use today if "Current Day" is selected
        let selectedDay = dayToSaveSelect.value;
        let useCurrentView = false;
        
        if (selectedDay === 'current') {
            // Use the current date that's being viewed
            selectedDay = new Date().toISOString().split('T')[0];
            useCurrentView = true;
        }
        
        if (!selectedDay) {
            alert('Please select a day to save');
            return;
        }
        
        // Get tasks for the selected day
        let tasksForDay;
        
        if (useCurrentView) {
            // Get all currently visible tasks
            tasksForDay = ganttChart.getVisibleTasks();
            console.log("Using visible tasks:", tasksForDay.length);
        } else {
            const selectedDate = new Date(selectedDay);
            console.log("Selected day:", selectedDay);
            console.log("Selected date object:", selectedDate);
            console.log("All scheduled tasks:", JSON.stringify(ganttChart.data.scheduledTasks));
            
            // Set time to midnight for proper date comparison
            selectedDate.setHours(0, 0, 0, 0);
            console.log("Normalized selected date:", selectedDate);
            
            tasksForDay = ganttChart.data.scheduledTasks.filter(task => {
                const taskDate = new Date(task.startTime);
                console.log("Task date before normalization:", taskDate, "from", task.startTime);
                
                // Set time to midnight for proper date comparison
                taskDate.setHours(0, 0, 0, 0);
                console.log("Normalized task date:", taskDate);
                
                // Compare dates
                const matches = taskDate.getTime() === selectedDate.getTime();
                console.log("Dates match?", matches, taskDate.getTime(), selectedDate.getTime());
                return matches;
            });
        }
        
        console.log("Tasks found for day:", tasksForDay.length);
        
        if (tasksForDay.length === 0) {
            // Allow saving empty templates for future use
            if (!confirm('There are no tasks scheduled for the selected day. Do you want to save an empty template?')) {
                return;
            }
        }
        
        // Create template object
        const template = {
            id: Date.now(),
            name: templateName,
            date: selectedDay,
            tasks: JSON.parse(JSON.stringify(tasksForDay)) // Deep copy
        };
        
        // Save template to localStorage
        const templates = JSON.parse(localStorage.getItem('dayTemplates'));
        templates.push(template);
        localStorage.setItem('dayTemplates', JSON.stringify(templates));
        
        // Clear input and update template list
        templateNameInput.value = '';
        populateTemplateSelect();
        
        alert(`Template "${templateName}" has been saved`);
    });
    
    // Delete template
    const deleteTemplateBtn = document.getElementById('delete-template-btn');
    deleteTemplateBtn.addEventListener('click', () => {
        const templateId = parseInt(templateToLoadSelect.value);
        if (!templateId) {
            alert('Please select a template to delete');
            return;
        }
        
        // Get the template
        const templates = JSON.parse(localStorage.getItem('dayTemplates'));
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
            alert('Template not found');
            return;
        }
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
            return;
        }
        
        // Remove the template
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        localStorage.setItem('dayTemplates', JSON.stringify(updatedTemplates));
        
        // Update the template select
        populateTemplateSelect();
        
        alert(`Template "${template.name}" has been deleted`);
    });
    
    // Load template
    loadTemplateBtn.addEventListener('click', () => {
        const templateId = parseInt(templateToLoadSelect.value);
        if (!templateId) {
            alert('Please select a template to load');
            return;
        }
        
        const dayToApply = dayToApplySelect.value;
        if (!dayToApply) {
            alert('Please select a day to apply the template to');
            return;
        }
        
        // Get the template
        const templates = JSON.parse(localStorage.getItem('dayTemplates'));
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
            alert('Template not found');
            return;
        }
        
        // Confirm before overwriting existing tasks
        const targetDate = new Date(dayToApply);
        // Set time to midnight for proper date comparison
        targetDate.setHours(0, 0, 0, 0);
        
        const existingTasks = ganttChart.data.scheduledTasks.filter(task => {
            const taskDate = new Date(task.startTime);
            // Set time to midnight for proper date comparison
            taskDate.setHours(0, 0, 0, 0);
            
            // Compare dates
            return taskDate.getTime() === targetDate.getTime();
        });
        
        if (existingTasks.length > 0) {
            if (!confirm(`This will replace ${existingTasks.length} existing tasks on ${targetDate.toDateString()}. Continue?`)) {
                return;
            }
            
            // Remove existing tasks for the target day
            ganttChart.data.scheduledTasks = ganttChart.data.scheduledTasks.filter(task => {
                const taskDate = new Date(task.startTime);
                // Set time to midnight for proper date comparison
                taskDate.setHours(0, 0, 0, 0);
                
                // Keep tasks that are NOT on the target date
                return taskDate.getTime() !== targetDate.getTime();
            });
        }
        
        // Apply template tasks to the target day
        const targetDateStr = targetDate.toISOString().split('T')[0];
        const templateTasks = template.tasks.map(task => {
            // Create a new task with the same properties but adjusted date
            const originalDate = new Date(task.startTime);
            const originalEndDate = new Date(task.endTime);
            
            // Calculate time components
            const hours = originalDate.getHours();
            const minutes = originalDate.getMinutes();
            const seconds = originalDate.getSeconds();
            
            const endHours = originalEndDate.getHours();
            const endMinutes = originalEndDate.getMinutes();
            const endSeconds = originalEndDate.getSeconds();
            
            // Create new dates with the target day but same time
            const newStartTime = new Date(targetDate);
            newStartTime.setHours(hours, minutes, seconds);
            
            const newEndTime = new Date(targetDate);
            newEndTime.setHours(endHours, endMinutes, endSeconds);
            
            return {
                id: Date.now() + Math.floor(Math.random() * 1000), // Generate unique ID
                taskId: task.taskId,
                employeeId: task.employeeId,
                startTime: newStartTime.toISOString(),
                endTime: newEndTime.toISOString()
            };
        });
        
        // Add the new tasks
        ganttChart.data.scheduledTasks = ganttChart.data.scheduledTasks.concat(templateTasks);
        
        // Re-render the view
        if (ganttChart.currentView === 'daily') {
            ganttChart.renderDailyView();
        } else {
            ganttChart.renderWeeklyView();
        }
        
        // Save data after applying a template
        ganttChart.saveData();
        
        // Close the modal
        templateModal.style.display = 'none';
        
        alert(`Template "${template.name}" has been applied to ${targetDate.toDateString()}`);
    });
    
    // Populate day selects with the next 14 days
    function populateDaySelects() {
        dayToSaveSelect.innerHTML = '';
        dayToApplySelect.innerHTML = '';
        
        // Add "Current Day" option for saving
        const currentOption = document.createElement('option');
        currentOption.value = 'current';
        currentOption.textContent = 'Current Day (with visible tasks)';
        dayToSaveSelect.appendChild(currentOption);
        
        const today = new Date();
        
        for (let i = 0; i < 14; i++) {
            const day = new Date();
            day.setDate(today.getDate() + i);
            
            const option = document.createElement('option');
            option.value = day.toISOString().split('T')[0];
            option.textContent = `${day.toLocaleDateString('en-US', { weekday: 'long' })} (${day.toLocaleDateString()})`;
            
            const optionClone = option.cloneNode(true);
            
            dayToSaveSelect.appendChild(option);
            dayToApplySelect.appendChild(optionClone);
        }
    }
    
    // Populate template select
    function populateTemplateSelect() {
        templateToLoadSelect.innerHTML = '';
        
        const templates = JSON.parse(localStorage.getItem('dayTemplates'));
        
        if (templates.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No templates available';
            templateToLoadSelect.appendChild(option);
            return;
        }
        
        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            const templateDate = new Date(template.date);
            option.textContent = `${template.name} (${templateDate.toLocaleDateString('en-US', { weekday: 'long' })})`;
            templateToLoadSelect.appendChild(option);
        });
    }
    
    // Function to generate a print-friendly table view
    function generatePrintView(ganttChart) {
        // Create a new window for the print view
        const printWindow = window.open('', '_blank');
        
        // Get the current date
        const today = new Date();
        
        // Start building the HTML content
        let printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Schedule - ${today.toLocaleDateString()}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 20px;
                    }
                    h1 {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    h2 {
                        margin-top: 30px;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                    }
                    h3 {
                        margin-top: 20px;
                        color: #555;
                    }
                    .task {
                        margin-left: 20px;
                        margin-bottom: 10px;
                    }
                    .time {
                        font-weight: bold;
                        display: inline-block;
                        width: 100px;
                    }
                    .task-name {
                        display: inline-block;
                    }
                    .print-date {
                        text-align: right;
                        color: #777;
                        font-size: 0.8em;
                        margin-bottom: 30px;
                    }
                    @media print {
                        body {
                            margin: 0.5in;
                        }
                        .no-break {
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>Schedule</h1>
                <div class="print-date">Printed on ${today.toLocaleDateString()} at ${today.toLocaleTimeString()}</div>
        `;
        
        // Get all scheduled tasks
        const tasks = ganttChart.data.scheduledTasks;
        
        // Group tasks by day
        const tasksByDay = {};
        
        tasks.forEach(task => {
            const startTime = new Date(task.startTime);
            const dateKey = startTime.toDateString();
            
            if (!tasksByDay[dateKey]) {
                tasksByDay[dateKey] = [];
            }
            
            tasksByDay[dateKey].push(task);
        });
        
        // Sort days
        const sortedDays = Object.keys(tasksByDay).sort((a, b) => new Date(a) - new Date(b));
        
        // Process each day
        sortedDays.forEach(day => {
            const dayDate = new Date(day);
            printContent += `<h2>${dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>`;
            
            // Group tasks by employee
            const tasksByEmployee = {};
            
            tasksByDay[day].forEach(task => {
                const employeeId = task.employeeId;
                
                if (!tasksByEmployee[employeeId]) {
                    tasksByEmployee[employeeId] = [];
                }
                
                tasksByEmployee[employeeId].push(task);
            });
            
            // Sort employees
            const sortedEmployees = Object.keys(tasksByEmployee).sort((a, b) => parseInt(a) - parseInt(b));
            
            // Process each employee
            sortedEmployees.forEach(employeeId => {
                // Find employee name
                const employee = ganttChart.data.employees.find(e => e.id === parseInt(employeeId));
                if (!employee) return;
                
                printContent += `<div class="no-break"><h3>${employee.name}</h3>`;
                
                // Sort tasks by start time
                const employeeTasks = tasksByEmployee[employeeId].sort((a, b) => 
                    new Date(a.startTime) - new Date(b.startTime)
                );
                
                // Process each task
                employeeTasks.forEach(task => {
                    const startTime = new Date(task.startTime);
                    
                    // Find task details
                    let taskDetails = null;
                    let productName = "";
                    
                    for (const product of ganttChart.data.products) {
                        const foundTask = product.tasks.find(t => t.id === task.taskId);
                        if (foundTask) {
                            taskDetails = foundTask;
                            productName = product.name;
                            break;
                        }
                    }
                    
                    if (!taskDetails) return;
                    
                    // Format the task
                    printContent += `
                        <div class="task">
                            <span class="time">${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            <span class="task-name">${productName}: ${taskDetails.name}</span>
                        </div>
                    `;
                });
                
                printContent += `</div>`;
            });
        });
        
        // Close the HTML
        printContent += `
            </body>
            </html>
        `;
        
        // Write to the new window and print
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Print after the content is loaded
        printWindow.onload = function() {
            printWindow.print();
        };
    }
    
    // Add a button to add a new product
    const addProductBtn = document.createElement('button');
    addProductBtn.textContent = 'Add New Product';
    addProductBtn.className = 'add-product-btn';
    document.querySelector('.sidebar h2').appendChild(addProductBtn);
    
    // Open employee modal when Add Employee button is clicked
    addEmployeeBtn.addEventListener('click', () => {
        openEmployeeModal();
    });
    
    // Update current day label in employee modal
    function updateCurrentDayLabel() {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        const currentDayLabel = document.getElementById('current-day-label');
        if (currentDayLabel) {
            currentDayLabel.textContent = ganttChart.currentDate.toLocaleDateString('en-US', options);
        }
    }
    
    // Open product modal when Add Product button is clicked
    addProductBtn.addEventListener('click', () => {
        openProductModal();
    });
    
    // Add a duplicate product button to the product modal
    const duplicateProductBtn = document.createElement('button');
    duplicateProductBtn.id = 'duplicate-product-btn';
    duplicateProductBtn.textContent = 'Duplicate Product';
    duplicateProductBtn.className = 'duplicate-product-btn';
    duplicateProductBtn.style.backgroundColor = '#17a2b8';
    duplicateProductBtn.style.color = 'white';
    duplicateProductBtn.style.border = 'none';
    duplicateProductBtn.style.padding = '8px 16px';
    duplicateProductBtn.style.borderRadius = '4px';
    duplicateProductBtn.style.marginRight = 'auto'; // Push it to the left
    duplicateProductBtn.style.display = 'none'; // Initially hidden
    
    // Add the duplicate button to the modal actions
    const modalActions = document.querySelector('#product-modal .modal-actions');
    modalActions.insertBefore(duplicateProductBtn, modalActions.firstChild);
    
    // Open product modal when product name is clicked (to edit)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('product-name')) {
            const productItem = e.target.closest('.product-item');
            const productId = parseInt(productItem.getAttribute('data-product-id'));
            openProductModal(productId);
        }
    });
    
    // Close product modal when X is clicked
    closeProductModal.addEventListener('click', () => {
        productModal.style.display = 'none';
    });
    
    // Close product modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });
    
    // Add a new task input row
    addTaskBtn.addEventListener('click', () => {
        addTaskInputRow();
    });
    
    // Duplicate product functionality
    duplicateProductBtn.addEventListener('click', () => {
        if (!editingProductId) return;
        
        const originalProduct = sampleData.products.find(p => p.id === editingProductId);
        if (!originalProduct) return;
        
        // Create a new product with the same tasks
        const newProduct = {
            id: Date.now(),
            name: `${originalProduct.name} (Copy)`,
            tasks: originalProduct.tasks.map(task => ({
                id: Date.now() + Math.floor(Math.random() * 1000), // Generate unique ID
                name: task.name,
                duration: task.duration
            }))
        };
        
        // Add the new product to the data
        sampleData.products.push(newProduct);
        
        // Close the current modal
        productModal.style.display = 'none';
        
        // Re-render the product list
        ganttChart.renderProductList();
        
        // Save data after duplicating a product
        ganttChart.saveData();
        
        // Open the modal for the new product to allow editing
        setTimeout(() => {
            openProductModal(newProduct.id);
        }, 100);
    });
    
    // Remove task input row
    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-task-btn')) {
            const row = e.target.closest('.task-input-row');
            if (taskList.children.length > 1) {
                row.remove();
            } else {
                // Clear inputs if it's the last row
                row.querySelector('.task-name-input').value = '';
                row.querySelector('.task-duration-input').value = '';
            }
        }
    });
    
    // Save product and tasks
    saveProductBtn.addEventListener('click', () => {
        const productName = productNameInput.value.trim();
        if (!productName) {
            alert('Please enter a product name');
            return;
        }
        
        // Collect tasks
        const tasks = [];
        const taskRows = taskList.querySelectorAll('.task-input-row');
        let hasValidTasks = false;
        
        taskRows.forEach(row => {
            const taskName = row.querySelector('.task-name-input').value.trim();
            const taskDuration = parseInt(row.querySelector('.task-duration-input').value);
            
            if (taskName && !isNaN(taskDuration) && taskDuration > 0) {
                tasks.push({
                    id: Date.now() + tasks.length, // Ensure unique IDs
                    name: taskName,
                    duration: taskDuration
                });
                hasValidTasks = true;
            }
        });
        
        if (!hasValidTasks) {
            alert('Please add at least one valid task with name and duration');
            return;
        }
        
        if (editingProductId) {
            // Update existing product
            const productIndex = sampleData.products.findIndex(p => p.id === editingProductId);
            if (productIndex !== -1) {
                sampleData.products[productIndex].name = productName;
                sampleData.products[productIndex].tasks = tasks;
            }
        } else {
            // Add new product
            const newProduct = {
                id: Date.now(),
                name: productName,
                tasks: tasks
            };
            sampleData.products.push(newProduct);
        }
        
        // Close modal and refresh product list
        productModal.style.display = 'none';
        ganttChart.renderProductList();
        
        // Save data after adding/updating a product
        ganttChart.saveData();
    });
    
    // Cancel product button
    cancelProductBtn.addEventListener('click', () => {
        productModal.style.display = 'none';
    });
    
    // Employee modal functionality
    closeEmployeeModal.addEventListener('click', () => {
        employeeModal.style.display = 'none';
    });
    
    // Close employee modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === employeeModal) {
            employeeModal.style.display = 'none';
        }
    });
    
    // Save employee
    saveEmployeeBtn.addEventListener('click', () => {
        const employeeName = employeeNameInput.value.trim();
        if (!employeeName) {
            alert('Please enter an employee name');
            return;
        }
        
        // Get employee type
        const employeeType = document.querySelector('input[name="employee-type"]:checked').value;
        const isGlobal = employeeType === 'global';
        
        // Generate a unique ID
        const allEmployeeIds = [
            ...sampleData.employees.map(e => e.id),
            ...Object.values(sampleData.daySpecificEmployees).flat().map(e => e.id)
        ];
        const newId = allEmployeeIds.length > 0 ? Math.max(...allEmployeeIds) + 1 : 1;
        
        // Create new employee object
        const newEmployee = {
            id: newId,
            name: employeeName,
            global: isGlobal
        };
        
        if (isGlobal) {
            // Add to global employees
            sampleData.employees.push(newEmployee);
        } else {
            // Add to day-specific employees
            const currentDateStr = ganttChart.getCurrentDateString();
            
            if (!sampleData.daySpecificEmployees[currentDateStr]) {
                sampleData.daySpecificEmployees[currentDateStr] = [];
            }
            
            sampleData.daySpecificEmployees[currentDateStr].push(newEmployee);
        }
        
        // Close modal and refresh
        employeeModal.style.display = 'none';
        employeeNameInput.value = '';
        
        // Re-render the view
        if (ganttChart.currentView === 'daily') {
            ganttChart.renderDailyView();
        } else {
            ganttChart.renderWeeklyView();
        }
        
        // Save data after adding an employee
        ganttChart.saveData();
    });
    
    // Cancel employee button
    cancelEmployeeBtn.addEventListener('click', () => {
        employeeModal.style.display = 'none';
    });
    
    // Function to open the employee modal
    function openEmployeeModal() {
        document.getElementById('employee-modal-title').textContent = 'Add New Employee';
        employeeNameInput.value = '';
        
        // Reset radio buttons
        document.querySelector('input[name="employee-type"][value="global"]').checked = true;
        
        // Update current day label
        updateCurrentDayLabel();
        
        employeeModal.style.display = 'block';
    }
    
    // Function to open the product modal
    function openProductModal(productId = null) {
        editingProductId = productId;
        
        // Clear previous inputs
        productNameInput.value = '';
        taskList.innerHTML = '';
        
        // Update modal title and show/hide duplicate button
        const modalTitle = document.querySelector('#product-modal h2');
        
        if (productId) {
            // Edit existing product
            modalTitle.textContent = 'Edit Product';
            duplicateProductBtn.style.display = 'block'; // Show duplicate button
            
            const product = sampleData.products.find(p => p.id === productId);
            if (product) {
                productNameInput.value = product.name;
                
                // Add task rows for existing tasks
                product.tasks.forEach(task => {
                    addTaskInputRow(task.name, task.duration);
                });
            }
        } else {
            // New product, add one empty task row
            modalTitle.textContent = 'Add New Product';
            duplicateProductBtn.style.display = 'none'; // Hide duplicate button
            addTaskInputRow();
        }
        
        productModal.style.display = 'block';
    }
    
    // Function to add a task input row
    function addTaskInputRow(name = '', duration = '') {
        const row = document.createElement('div');
        row.className = 'task-input-row';
        row.innerHTML = `
            <input type="text" class="task-name-input" placeholder="Task name" value="${name}">
            <input type="number" class="task-duration-input" placeholder="Minutes" min="1" value="${duration}">
            <button class="remove-task-btn">×</button>
        `;
        taskList.appendChild(row);
    }
});
