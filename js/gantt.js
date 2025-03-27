class GanttChart {
    constructor(data) {
        this.data = data;
        this.currentDate = new Date();
        this.currentView = 'daily';
        this.draggedTask = null;
        this.dragOffset = { x: 0, y: 0 };
        this.minutesPerPixel = 0.6; // 1 pixel = 0.6 minutes (60 minutes = 100 pixels)
        this.zoomLevel = 1; // Default zoom level
        this.pixelsPerHour = 100; // Default pixels per hour
        
        // Load saved data from localStorage
        this.loadSavedData();
        
        // Initialize the chart
        this.init();
    }
    
    init() {
        this.renderProductList();
        this.renderDailyView();
        this.renderWeeklyView();
        this.setupEventListeners();
        this.setupZoomControls();
    }
    
    renderProductList() {
        const productList = document.getElementById('product-list');
        productList.innerHTML = '';
        
        // Add a helper message for drag and drop
        const dragHint = document.createElement('div');
        dragHint.className = 'drag-hint';
        dragHint.textContent = 'Drag products to reorder';
        productList.appendChild(dragHint);
        
        if (!this.data.products || this.data.products.length === 0) {
            const noProductsMsg = document.createElement('div');
            noProductsMsg.className = 'no-products-message';
            noProductsMsg.textContent = 'No products added yet. Click "Add New Product" to get started.';
            noProductsMsg.style.padding = '10px';
            noProductsMsg.style.color = '#666';
            noProductsMsg.style.fontStyle = 'italic';
            productList.appendChild(noProductsMsg);
            return;
        }
        
        this.data.products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.setAttribute('data-product-id', product.id);
            productItem.setAttribute('draggable', 'true');
            
            const productHeader = document.createElement('div');
            productHeader.className = 'product-header';
            
            const expandIcon = document.createElement('span');
            expandIcon.className = 'expand-icon';
            expandIcon.textContent = '▶';
            
            const productName = document.createElement('div');
            productName.className = 'product-name';
            productName.textContent = product.name;
            
            const deleteIcon = document.createElement('span');
            deleteIcon.className = 'delete-product';
            deleteIcon.textContent = '×';
            deleteIcon.title = 'Delete product';
            
            productHeader.appendChild(expandIcon);
            productHeader.appendChild(productName);
            productHeader.appendChild(deleteIcon);
            
            const productTasks = document.createElement('div');
            productTasks.className = 'product-tasks';
            productTasks.style.display = 'none'; // Initially collapsed
            
            product.tasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.setAttribute('draggable', 'true');
                taskItem.setAttribute('data-task-id', task.id);
                taskItem.setAttribute('data-duration', task.duration);
                taskItem.textContent = `${task.name} (${this.formatDuration(task.duration)})`;
                productTasks.appendChild(taskItem);
            });
            
            productItem.appendChild(productHeader);
            productItem.appendChild(productTasks);
            productList.appendChild(productItem);
            
            // Add drag and drop event listeners
            productItem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', product.id);
                productItem.classList.add('dragging');
            });
            
            productItem.addEventListener('dragend', () => {
                productItem.classList.remove('dragging');
            });
            
            // Add event listener for expand/collapse
            expandIcon.addEventListener('click', () => {
                if (productTasks.style.display === 'none') {
                    productTasks.style.display = 'block';
                    expandIcon.textContent = '▼';
                } else {
                    productTasks.style.display = 'none';
                    expandIcon.textContent = '▶';
                }
            });
            
            // Add event listener for delete product
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${product.name}" and all its tasks?`)) {
                    this.deleteProduct(product.id);
                }
            });
        });
        
        // Add drop zone functionality to the product list
        productList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.product-item.dragging');
            if (!draggingItem) return;
            
            const afterElement = this.getDragAfterElement(productList, e.clientY);
            if (afterElement) {
                productList.insertBefore(draggingItem, afterElement);
            } else {
                productList.appendChild(draggingItem);
            }
        });
        
        productList.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedProductId = parseInt(e.dataTransfer.getData('text/plain'));
            
            // Update the data array to match the new order
            const newOrder = Array.from(productList.querySelectorAll('.product-item'))
                .filter(item => item.getAttribute('data-product-id'))
                .map(item => parseInt(item.getAttribute('data-product-id')));
            
            // Reorder the products array
            this.reorderProducts(newOrder);
        });
    }
    
    // Helper method to determine where to place the dragged element
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.product-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Reorder products based on new order of IDs
    reorderProducts(newOrder) {
        // Create a new array with the products in the new order
        const reorderedProducts = [];
        
        newOrder.forEach(id => {
            const product = this.data.products.find(p => p.id === id);
            if (product) {
                reorderedProducts.push(product);
            }
        });
        
        // Update the products array
        this.data.products = reorderedProducts;
        
        // Save data after reordering products
        this.saveData();
    }
    
    deleteProduct(productId) {
        // Remove the product from the data
        const productIndex = this.data.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            this.data.products.splice(productIndex, 1);
            
            // Remove any scheduled tasks for this product
            const tasksToRemove = [];
            this.data.scheduledTasks.forEach(task => {
                const removedProduct = this.data.products[productIndex];
                if (removedProduct && removedProduct.tasks.some(t => t.id === task.taskId)) {
                    tasksToRemove.push(task.id);
                }
            });
            
            tasksToRemove.forEach(taskId => {
                this.deleteTask(taskId);
            });
            
            // Re-render the product list
            this.renderProductList();
        }
    }
    
    renderDailyView() {
        // Add or update date display
        this.renderDateDisplay();
        this.renderTimelineHeader();
        this.renderEmployeeRows();
        this.renderScheduledTasks();
    }
    
    renderDateDisplay() {
        // Find or create the date display container
        let dateDisplayContainer = document.getElementById('date-display-container');
        if (!dateDisplayContainer) {
            dateDisplayContainer = document.createElement('div');
            dateDisplayContainer.id = 'date-display-container';
            
            // Insert it at the top of the daily view
            const dailyView = document.getElementById('daily-view');
            dailyView.insertBefore(dateDisplayContainer, dailyView.firstChild);
        }
        
        // Create the date navigation
        dateDisplayContainer.innerHTML = `
            <button id="prev-day-btn" class="day-nav-btn">&lt;</button>
            <div id="current-date-display"></div>
            <button id="next-day-btn" class="day-nav-btn">&gt;</button>
        `;
        
        // Format and display the current date
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('current-date-display').textContent = 
            this.currentDate.toLocaleDateString('en-US', options);
        
        // Add a Clear Day button
        const clearDayBtn = document.createElement('button');
        clearDayBtn.id = 'clear-current-day-btn';
        clearDayBtn.className = 'day-nav-btn clear-day-btn';
        clearDayBtn.textContent = 'Clear Day';
        clearDayBtn.style.backgroundColor = '#ff4d4f';
        clearDayBtn.style.color = 'white';
        clearDayBtn.style.marginLeft = '10px';
        
        dateDisplayContainer.appendChild(clearDayBtn);
        
        // Add event listeners for navigation buttons
        document.getElementById('prev-day-btn').addEventListener('click', () => {
            const prevDay = new Date(this.currentDate);
            prevDay.setDate(prevDay.getDate() - 1);
            this.currentDate = prevDay;
            this.renderDailyView();
        });
        
        document.getElementById('next-day-btn').addEventListener('click', () => {
            const nextDay = new Date(this.currentDate);
            nextDay.setDate(nextDay.getDate() + 1);
            this.currentDate = nextDay;
            this.renderDailyView();
        });
        
        // Add event listener for Clear Day button
        document.getElementById('clear-current-day-btn').addEventListener('click', () => {
            if (confirm(`Are you sure you want to clear all tasks for ${this.currentDate.toLocaleDateString('en-US', options)}?`)) {
                this.clearDay(this.currentDate);
                this.renderDailyView();
            }
        });
    }
    
    renderTimelineHeader() {
        const timelineHeader = document.querySelector('.timeline-header');
        timelineHeader.innerHTML = '';
        
        // Add employee name column
        const nameHeader = document.createElement('div');
        nameHeader.className = 'employee-name';
        nameHeader.textContent = 'Employee';
        timelineHeader.appendChild(nameHeader);
        
        // Add hour markers (10 AM to 12 AM)
        for (let hour = 10; hour <= 24; hour++) {
            const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
            const amPm = hour >= 12 && hour < 24 ? 'PM' : 'AM';
            
            const hourMarker = document.createElement('div');
            hourMarker.className = 'hour-marker';
            hourMarker.style.width = `${this.pixelsPerHour}px`;
            hourMarker.style.minWidth = `${this.pixelsPerHour}px`;
            
            // Add half-hour marker if zoom level is high enough
            if (this.zoomLevel >= 1.5) {
                hourMarker.innerHTML = `
                    <div>${displayHour} ${amPm}</div>
                    <div class="half-hour-marker">:30</div>
                `;
            } else {
                hourMarker.textContent = `${displayHour} ${amPm}`;
            }
            
            timelineHeader.appendChild(hourMarker);
        }
    }
    
    renderEmployeeRows() {
        const employeesContainer = document.querySelector('.employees');
        employeesContainer.innerHTML = '';
        
        // Get all employees for the current day
        const employees = this.getEmployeesForCurrentDay();
        
        employees.forEach(employee => {
            const employeeRow = document.createElement('div');
            employeeRow.className = 'employee-row';
            employeeRow.setAttribute('data-employee-id', employee.id);
            
            const employeeName = document.createElement('div');
            employeeName.className = 'employee-name';
            
            // Create a container for the name and delete button
            const nameContainer = document.createElement('div');
            nameContainer.style.display = 'flex';
            nameContainer.style.alignItems = 'center';
            nameContainer.style.justifyContent = 'space-between';
            nameContainer.style.width = '100%';
            
            const nameText = document.createElement('span');
            nameText.textContent = employee.name;
            nameText.title = "Click to rename employee";
            nameText.style.cursor = "pointer";
            
            // Add click event to rename employee
            nameText.addEventListener('click', (e) => {
                const newName = prompt("Enter new name for this employee:", employee.name);
                if (newName && newName.trim() !== "") {
                    // Update employee name in data
                    this.updateEmployeeName(employee.id, newName.trim());
                    // Update display
                    nameText.textContent = newName.trim();
                    // Re-render weekly view if it's active
                    if (this.currentView === 'weekly') {
                        this.renderWeeklyView();
                    }
                }
            });
            
            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-employee-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Delete employee';
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteEmployeeModal(employee);
            });
            
            nameContainer.appendChild(nameText);
            nameContainer.appendChild(deleteBtn);
            employeeName.appendChild(nameContainer);
            
            // Add badge for day-specific employees
            if (!employee.global) {
                const badge = document.createElement('div');
                badge.className = 'day-specific-badge';
                badge.textContent = 'Today only';
                employeeName.appendChild(badge);
            }
            
            const employeeTimeline = document.createElement('div');
            employeeTimeline.className = 'employee-timeline';
            
            // Add hour cells (10 AM to 12 AM)
            for (let hour = 10; hour <= 24; hour++) {
                const timelineCell = document.createElement('div');
                timelineCell.className = 'timeline-cell';
                timelineCell.setAttribute('data-hour', hour);
                timelineCell.style.width = `${this.pixelsPerHour}px`;
                timelineCell.style.minWidth = `${this.pixelsPerHour}px`;
                
                // Add time increment markers if zoom level is high enough
                if (this.zoomLevel >= 1.5) {
                    // Half-hour marker
                    const halfHourMarker = document.createElement('div');
                    halfHourMarker.className = 'half-hour-marker-line';
                    halfHourMarker.style.left = '50%';
                    timelineCell.appendChild(halfHourMarker);
                    
                    // 5-minute markers if zoom is very high
                    if (this.zoomLevel >= 2) {
                        for (let i = 1; i < 12; i++) {
                            if (i !== 6) { // Skip half-hour as it's already added
                                const fiveMinMarker = document.createElement('div');
                                fiveMinMarker.className = 'five-min-marker-line';
                                fiveMinMarker.style.left = `${i * 8.33}%`;
                                timelineCell.appendChild(fiveMinMarker);
                            }
                        }
                    }
                }
                
                employeeTimeline.appendChild(timelineCell);
            }
            
            employeeRow.appendChild(employeeName);
            employeeRow.appendChild(employeeTimeline);
            employeesContainer.appendChild(employeeRow);
        });
    }
    
    renderWeeklyView() {
        const weeklyView = document.getElementById('weekly-view');
        weeklyView.innerHTML = '';
        
        // Get the current week's days
        const currentDate = new Date(this.currentDate);
        const dayOfWeek = currentDate.getDay();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
        
        // Add week navigation controls
        const weekNavContainer = document.createElement('div');
        weekNavContainer.className = 'week-nav-container';
        
        const prevWeekBtn = document.createElement('button');
        prevWeekBtn.id = 'prev-week-btn';
        prevWeekBtn.className = 'week-nav-btn';
        prevWeekBtn.innerHTML = '&lt; Previous Week';
        
        const weekDisplay = document.createElement('div');
        weekDisplay.id = 'current-week-display';
        
        // Format the week display (e.g., "March 25 - 31, 2025")
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        let weekDisplayText;
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
            // Same month
            weekDisplayText = `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
        } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
            // Different months, same year
            weekDisplayText = `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()} - ${endOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
        } else {
            // Different years
            weekDisplayText = `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()}, ${startOfWeek.getFullYear()} - ${endOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
        }
        
        weekDisplay.textContent = weekDisplayText;
        
        const nextWeekBtn = document.createElement('button');
        nextWeekBtn.id = 'next-week-btn';
        nextWeekBtn.className = 'week-nav-btn';
        nextWeekBtn.innerHTML = 'Next Week &gt;';
        
        weekNavContainer.appendChild(prevWeekBtn);
        weekNavContainer.appendChild(weekDisplay);
        weekNavContainer.appendChild(nextWeekBtn);
        
        weeklyView.appendChild(weekNavContainer);
        
        // Add event listeners for week navigation
        prevWeekBtn.addEventListener('click', () => {
            const prevWeek = new Date(this.currentDate);
            prevWeek.setDate(prevWeek.getDate() - 7);
            this.currentDate = prevWeek;
            this.renderWeeklyView();
        });
        
        nextWeekBtn.addEventListener('click', () => {
            const nextWeek = new Date(this.currentDate);
            nextWeek.setDate(nextWeek.getDate() + 7);
            this.currentDate = nextWeek;
            this.renderWeeklyView();
        });
        
        // Create a container for the weekly schedule
        const weeklyContainer = document.createElement('div');
        weeklyContainer.className = 'weekly-container';
        
        // Create day sections for each day of the week
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            
            const daySection = document.createElement('div');
            daySection.className = 'day-section';
            
            // Highlight the current day being viewed
            if (day.toDateString() === this.currentDate.toDateString()) {
                daySection.classList.add('current-day');
            }
            
            // Create day header
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = `${day.toLocaleDateString('en-US', { weekday: 'long' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            dayHeader.style.cursor = 'pointer';
            
            // Create a button container
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.marginTop = '8px';
            buttonContainer.style.gap = '8px';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.width = '60%';
            buttonContainer.style.margin = '8px auto 0';
            
            // Create a "View Day" button
            const viewDayBtn = document.createElement('button');
            viewDayBtn.className = 'view-day-btn';
            viewDayBtn.textContent = 'View Day';
            viewDayBtn.style.padding = '2px 6px';
            viewDayBtn.style.backgroundColor = '#1890ff';
            viewDayBtn.style.color = 'white';
            viewDayBtn.style.border = 'none';
            viewDayBtn.style.borderRadius = '4px';
            viewDayBtn.style.cursor = 'pointer';
            viewDayBtn.style.fontSize = '0.8rem';
            viewDayBtn.style.minWidth = '60px';
            
            // Create a "Clear Day" button
            const clearDayBtn = document.createElement('button');
            clearDayBtn.className = 'clear-day-btn';
            clearDayBtn.textContent = 'Clear Day';
            clearDayBtn.style.padding = '2px 6px';
            clearDayBtn.style.backgroundColor = '#ff4d4f';
            clearDayBtn.style.color = 'white';
            clearDayBtn.style.border = 'none';
            clearDayBtn.style.borderRadius = '4px';
            clearDayBtn.style.cursor = 'pointer';
            clearDayBtn.style.fontSize = '0.8rem';
            clearDayBtn.style.minWidth = '60px';
            
            // Add click event to the View Day button
            viewDayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('View Day button clicked:', day.toDateString());
                // Set the current date to this day
                this.currentDate = new Date(day);
                // Switch to daily view
                this.switchView('daily');
            });
            
            // Add click event to the Clear Day button
            clearDayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Confirm before clearing
                if (confirm(`Are you sure you want to clear all tasks for ${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}?`)) {
                    this.clearDay(day);
                    // Re-render the weekly view
                    this.renderWeeklyView();
                }
            });
            
            // Add buttons to the container
            buttonContainer.appendChild(viewDayBtn);
            buttonContainer.appendChild(clearDayBtn);
            
            // Add the button container to the day header
            dayHeader.appendChild(buttonContainer);
            
            // Add click event to the day header itself as well
            dayHeader.addEventListener('click', (e) => {
                // Only trigger if the click was directly on the header, not on the buttons
                if (e.target === dayHeader) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Day header clicked:', day.toDateString());
                    // Set the current date to this day
                    this.currentDate = new Date(day);
                    // Switch to daily view
                    this.switchView('daily');
                }
            });
            
            daySection.appendChild(dayHeader);
            
            // Create employee rows for this day
            this.data.employees.forEach(employee => {
                const employeeRow = document.createElement('div');
                employeeRow.className = 'weekly-employee-row';
                
                const employeeName = document.createElement('div');
                employeeName.className = 'weekly-employee-name';
                employeeName.textContent = employee.name;
                employeeName.title = "Click to rename employee";
                employeeName.style.cursor = "pointer";
                
                // Add click event to rename employee
                employeeName.addEventListener('click', (e) => {
                    const newName = prompt("Enter new name for this employee:", employee.name);
                    if (newName && newName.trim() !== "") {
                        // Update employee name in data
                        employee.name = newName.trim();
                        // Update display
                        employeeName.textContent = newName.trim();
                        // Re-render daily view if it's active
                        if (this.currentView === 'daily') {
                            this.renderDailyView();
                        }
                    }
                });
                employeeRow.appendChild(employeeName);
                
                // Create a container for the tasks
                const tasksContainer = document.createElement('div');
                tasksContainer.className = 'weekly-tasks-container';
                
                // Find tasks for this employee on this day, excluding tasks before 10am
                const employeeTasks = this.data.scheduledTasks.filter(task => {
                    const taskDate = new Date(task.startTime);
                    
                    // Check if task is for this employee on this day
                    const isMatch = task.employeeId === employee.id && 
                           taskDate.getDate() === day.getDate() &&
                           taskDate.getMonth() === day.getMonth() &&
                           taskDate.getFullYear() === day.getFullYear();
                    
                    // Only include tasks that start at or after 10am
                    const isAfter10am = taskDate.getHours() >= 10;
                    
                    // Log tasks that match this day
                    if (isMatch) {
                        console.log(`Task found for ${employee.name} on ${day.toDateString()}:`, 
                            task, 
                            "Start time:", new Date(task.startTime).toLocaleTimeString(),
                            "Included:", isAfter10am ? "Yes (after 10am)" : "No (before 10am)");
                    }
                    
                    return isMatch && isAfter10am;
                });
                
                // Sort tasks by start time
                employeeTasks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                
                // Add tasks to the container
                employeeTasks.forEach(task => {
                    const startTime = new Date(task.startTime);
                    const endTime = new Date(task.endTime);
                    
                    // Find task details
                    let taskDetails = null;
                    let productName = "";
                    
                    for (const product of this.data.products) {
                        const foundTask = product.tasks.find(t => t.id === task.taskId);
                        if (foundTask) {
                            taskDetails = foundTask;
                            productName = product.name;
                            break;
                        }
                    }
                    
                    if (!taskDetails) return;
                    
                    // Create task element
                    const taskElement = document.createElement('div');
                    taskElement.className = 'weekly-task';
                    taskElement.innerHTML = `
                        <div class="weekly-task-time">${this.formatTime(startTime)} - ${this.formatTime(endTime)}</div>
                        <div class="weekly-task-name">${productName}: ${taskDetails.name}</div>
                    `;
                    
                    tasksContainer.appendChild(taskElement);
                });
                
                employeeRow.appendChild(tasksContainer);
                daySection.appendChild(employeeRow);
            });
            
            weeklyContainer.appendChild(daySection);
        }
        
        weeklyView.appendChild(weeklyContainer);
    }
    
    renderScheduledTasks() {
        // Clear existing scheduled tasks
        document.querySelectorAll('.scheduled-task').forEach(el => el.remove());
        
        // Filter out tasks that start before 10am
        const visibleTasks = this.data.scheduledTasks.filter(task => {
            const startTime = new Date(task.startTime);
            return startTime.getHours() >= 10;
        });
        
        visibleTasks.forEach(task => {
            const startTime = new Date(task.startTime);
            const endTime = new Date(task.endTime);
            
            // Only render tasks for the current day in daily view
            if (this.currentView === 'daily') {
                const employeeRow = document.querySelector(`.employee-row[data-employee-id="${task.employeeId}"]`);
                if (!employeeRow) return;
                
                const employeeTimeline = employeeRow.querySelector('.employee-timeline');
                
                // Find the task details and product
                let taskDetails = null;
                let productName = "";
                
                for (const product of this.data.products) {
                    const foundTask = product.tasks.find(t => t.id === task.taskId);
                    if (foundTask) {
                        taskDetails = foundTask;
                        productName = product.name;
                        break;
                    }
                }
                
                if (!taskDetails) return;
                
                // Calculate position and width
                const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                
                // Only show tasks between 10 AM and 12 AM
                if (startHour >= 24 || endHour <= 10) return;
                
                const left = Math.max(0, (startHour - 10) * this.pixelsPerHour);
                const width = Math.max(25, (endHour - startHour) * this.pixelsPerHour); // Ensure minimum width for visibility
                
                // Calculate actual duration in minutes
                const durationMs = endTime - startTime;
                const durationMinutes = Math.round(durationMs / (60 * 1000));
                
                // Check if this task is connected to another task
                let isConnectedToPrevious = false;
                let isConnectedToNext = false;
                
                // Find tasks that might be connected to this one
                this.data.scheduledTasks.forEach(otherTask => {
                    if (otherTask.id !== task.id && otherTask.employeeId === task.employeeId) {
                        const otherStart = new Date(otherTask.startTime);
                        const otherEnd = new Date(otherTask.endTime);
                        
                        // Check if this task starts exactly when another ends
                        if (Math.abs(startTime - otherEnd) < 1000) { // Within 1 second
                            isConnectedToPrevious = true;
                        }
                        
                        // Check if this task ends exactly when another starts
                        if (Math.abs(endTime - otherStart) < 1000) { // Within 1 second
                            isConnectedToNext = true;
                        }
                    }
                });
                
                // Create the task element
                const taskElement = document.createElement('div');
                taskElement.className = 'scheduled-task';
                if (isConnectedToPrevious) taskElement.classList.add('connected-previous');
                if (isConnectedToNext) taskElement.classList.add('connected-next');
                
                taskElement.setAttribute('data-task-id', task.taskId);
                taskElement.setAttribute('data-scheduled-id', task.id);
                taskElement.setAttribute('draggable', 'true');
                taskElement.style.left = `${left}px`;
                taskElement.style.width = `${width}px`;
                
                // Determine what to show based on width
                let taskContent = '';
                
                // Always show product and task name
                taskContent += `<div class="product-label">${productName}</div>`;
                taskContent += `<div class="task-name">${taskDetails.name}</div>`;
                
                // Only show time and duration if there's enough space
                if (width >= 80) {
                    taskContent += `<div class="task-time">${this.formatTime(startTime)} - ${this.formatTime(endTime)}</div>`;
                    if (width >= 100) {
                        taskContent += `<div class="task-duration">(${this.formatDuration(durationMinutes)})</div>`;
                    }
                } else {
                    // For very small tasks, show a tooltip with all info
                    taskElement.setAttribute('title', 
                        `${productName}: ${taskDetails.name}\n${this.formatTime(startTime)} - ${this.formatTime(endTime)}\n(${this.formatDuration(durationMinutes)})`
                    );
                }
                
                taskElement.innerHTML = taskContent;
                
                // Apply current settings to the new task
                const settings = JSON.parse(localStorage.getItem('ganttChartSettings')) || {};
                if (settings['task-bg-color']) {
                    taskElement.style.backgroundColor = settings['task-bg-color'];
                }
                if (settings['task-text-color']) {
                    taskElement.style.color = settings['task-text-color'];
                }
                
                employeeTimeline.appendChild(taskElement);
            }
        });
    }
    
    setupEventListeners() {
        // View toggle
        document.getElementById('daily-view-btn').addEventListener('click', () => this.switchView('daily'));
        document.getElementById('weekly-view-btn').addEventListener('click', () => this.switchView('weekly'));
        
        // Drag and drop functionality
        this.setupDragAndDrop();
        
        // Context menu for tasks
        this.setupTaskContextMenu();
    }
    
    setupTaskContextMenu() {
        const contextMenu = document.getElementById('task-context-menu');
        const deleteDialog = document.getElementById('delete-confirm-dialog');
        let activeTaskId = null;
        
        // Show context menu on task click
        document.addEventListener('click', (e) => {
            // Close any open context menu first
            contextMenu.style.display = 'none';
            
            // Check if clicked on a task
            const taskElement = e.target.closest('.scheduled-task');
            if (taskElement) {
                e.preventDefault();
                activeTaskId = parseInt(taskElement.getAttribute('data-scheduled-id'));
                
                // Position and show context menu
                contextMenu.style.left = `${e.pageX}px`;
                contextMenu.style.top = `${e.pageY}px`;
                contextMenu.style.display = 'block';
            }
        });
        
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.scheduled-task')) {
                contextMenu.style.display = 'none';
            }
        });
        
        // Handle delete option
        document.getElementById('delete-task-option').addEventListener('click', () => {
            if (activeTaskId) {
                // Show delete confirmation dialog
                deleteDialog.style.display = 'block';
                contextMenu.style.display = 'none';
            }
        });
        
        // Confirm delete
        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            if (activeTaskId) {
                this.deleteTask(activeTaskId);
                deleteDialog.style.display = 'none';
                activeTaskId = null;
            }
        });
        
        // Cancel delete
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            deleteDialog.style.display = 'none';
        });
        
        // Close delete dialog when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === deleteDialog) {
                deleteDialog.style.display = 'none';
            }
        });
    }
    
    setupZoomControls() {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomLevelDisplay = document.getElementById('zoom-level');
        
        zoomInBtn.addEventListener('click', () => {
            if (this.zoomLevel < 3) {
                this.zoomLevel += 0.25;
                this.updateZoom();
            }
        });
        
        zoomOutBtn.addEventListener('click', () => {
            if (this.zoomLevel > 0.5) {
                this.zoomLevel -= 0.25;
                this.updateZoom();
            }
        });
    }
    
    updateZoom() {
        this.pixelsPerHour = 100 * this.zoomLevel;
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
        this.renderDailyView();
    }
    
    deleteTask(scheduledId) {
        const index = this.data.scheduledTasks.findIndex(task => task.id === scheduledId);
        if (index !== -1) {
            this.data.scheduledTasks.splice(index, 1);
            this.renderScheduledTasks();
            this.saveData(); // Save data after deleting a task
        }
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-toggle button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${view}-view-btn`).classList.add('active');
        
        // Show active view
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');
        
        // Render the appropriate view
        if (view === 'daily') {
            this.renderDailyView();
        } else {
            this.renderWeeklyView();
        }
    }
    
    setupDragAndDrop() {
        // Make tasks draggable
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                this.draggedTask = {
                    element: e.target,
                    taskId: parseInt(e.target.getAttribute('data-task-id')),
                    duration: parseInt(e.target.getAttribute('data-duration'))
                };
                
                // Find task details
                for (const product of this.data.products) {
                    const task = product.tasks.find(t => t.id === this.draggedTask.taskId);
                    if (task) {
                        this.draggedTask.details = task;
                        break;
                    }
                }
                
                e.dataTransfer.setData('text/plain', e.target.getAttribute('data-task-id'));
                e.dataTransfer.effectAllowed = 'move';
                e.target.classList.add('dragging');
            } else if (e.target.classList.contains('scheduled-task')) {
                this.draggedTask = {
                    element: e.target,
                    scheduledId: parseInt(e.target.getAttribute('data-scheduled-id')),
                    taskId: parseInt(e.target.getAttribute('data-task-id'))
                };
                
                // Find the scheduled task
                const scheduledTask = this.data.scheduledTasks.find(t => t.id === this.draggedTask.scheduledId);
                if (scheduledTask) {
                    this.draggedTask.details = scheduledTask;
                }
                
                e.dataTransfer.setData('text/plain', e.target.getAttribute('data-scheduled-id'));
                e.dataTransfer.effectAllowed = 'move';
                
                // Calculate drag offset
                const rect = e.target.getBoundingClientRect();
                this.dragOffset.x = e.clientX - rect.left;
                
                e.target.classList.add('dragging');
            }
        });
        
        // Handle drag over
        document.addEventListener('dragover', (e) => {
            if (this.draggedTask && e.target.closest('.employee-timeline')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }
        });
        
        // Handle drop
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (!this.draggedTask) return;
            
            const timeline = e.target.closest('.employee-timeline');
            if (!timeline) return;
            
            const employeeRow = timeline.closest('.employee-row');
            const employeeId = parseInt(employeeRow.getAttribute('data-employee-id'));
            
            // Calculate drop time
            const timelineRect = timeline.getBoundingClientRect();
            const dropX = e.clientX - timelineRect.left - (this.dragOffset.x || 0);
            
            // Convert pixels to time (10 AM + dropX / pixelsPerHour hours)
            const dropHour = 10 + (dropX / this.pixelsPerHour);
            const dropHourInt = Math.floor(dropHour);
            let dropMinutes = Math.floor((dropHour - dropHourInt) * 60);
            
            // Snap to 5-minute increments
            dropMinutes = Math.round(dropMinutes / 5) * 5;
            
            // Create start and end times
            const today = new Date();
            let startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), dropHourInt, dropMinutes, 0);
            
            // Check for task collisions and adjust start time if needed
            if (this.draggedTask) {
                // Find task duration
                let taskDuration = 30; // Default duration
                if (this.draggedTask.details) {
                    if (this.draggedTask.details.duration) {
                        // For new tasks from product area
                        taskDuration = this.draggedTask.details.duration;
                    } else if (this.draggedTask.details.startTime && this.draggedTask.details.endTime) {
                        // For existing scheduled tasks
                        const start = new Date(this.draggedTask.details.startTime);
                        const end = new Date(this.draggedTask.details.endTime);
                        taskDuration = Math.round((end - start) / (60 * 1000));
                    }
                }
                
                // Get the employee's existing tasks
                const employeeTasks = this.data.scheduledTasks.filter(t => 
                    t.employeeId === employeeId && 
                    (!this.draggedTask.scheduledId || t.id !== this.draggedTask.scheduledId)
                );
                
                // Sort tasks by start time
                employeeTasks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                
                // Find the nearest task that ends before our proposed start time
                let previousTask = null;
                let nextTask = null;
                
                for (const task of employeeTasks) {
                    const taskStart = new Date(task.startTime);
                    const taskEnd = new Date(task.endTime);
                    
                    // If task ends after our start time, it's a potential next task
                    if (taskStart >= startTime) {
                        if (!nextTask || taskStart < new Date(nextTask.startTime)) {
                            nextTask = task;
                        }
                    }
                    
                    // If task ends before our start time, it's a potential previous task
                    if (taskEnd <= startTime) {
                        if (!previousTask || taskEnd > new Date(previousTask.endTime)) {
                            previousTask = task;
                        }
                    }
                }
                
                // If there's a previous task, check if we need to snap to it
                if (previousTask) {
                    const prevEnd = new Date(previousTask.endTime);
                    // If we're very close to the previous task's end (within 5 minutes), snap to it
                    const timeDiff = Math.abs(startTime - prevEnd);
                    if (timeDiff < 5 * 60 * 1000) {
                        startTime = new Date(prevEnd);
                    } else if (timeDiff < 15 * 60 * 1000) {
                        // If we're somewhat close (5-15 minutes), snap to 5-minute increments after the task
                        const minutesAfter = Math.ceil(timeDiff / (5 * 60 * 1000)) * 5;
                        startTime = new Date(prevEnd);
                        startTime.setMinutes(prevEnd.getMinutes() + minutesAfter);
                    }
                }
                
                // Calculate end time
                const endTime = new Date(startTime);
                endTime.setMinutes(startTime.getMinutes() + taskDuration);
                
                // If there's a next task and we would overlap, adjust to start right before it
                if (nextTask) {
                    const nextStart = new Date(nextTask.startTime);
                    if (endTime > nextStart) {
                        // If there's not enough space between tasks, place it after the next task
                        const nextEnd = new Date(nextTask.endTime);
                        startTime = new Date(nextEnd);
                        // Recalculate end time
                        const adjustedEndTime = new Date(startTime);
                        adjustedEndTime.setMinutes(startTime.getMinutes() + taskDuration);
                        endTime.setTime(adjustedEndTime.getTime());
                    }
                }
                
                if (this.draggedTask.scheduledId) {
                    // Update existing scheduled task
                    const taskIndex = this.data.scheduledTasks.findIndex(t => t.id === this.draggedTask.scheduledId);
                    if (taskIndex !== -1) {
                        this.data.scheduledTasks[taskIndex].employeeId = employeeId;
                        this.data.scheduledTasks[taskIndex].startTime = startTime.toISOString();
                        this.data.scheduledTasks[taskIndex].endTime = endTime.toISOString();
                    }
                } else {
                    // Create new scheduled task
                    const newScheduledTask = {
                        id: Date.now(), // Generate a unique ID
                        taskId: this.draggedTask.taskId,
                        employeeId: employeeId,
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString()
                    };
                    
                    this.data.scheduledTasks.push(newScheduledTask);
                    
                    // Save data after adding a new task
                    this.saveData();
                }
            }
            
            // Reset dragged task
            this.draggedTask = null;
            this.dragOffset = { x: 0, y: 0 };
            
            // Re-render the scheduled tasks
            this.renderScheduledTasks();
            
            // Save data after adding or moving a task
            this.saveData();
        });
        
        // Reset dragged task on drag end
        document.addEventListener('dragend', (e) => {
            document.querySelectorAll('.dragging').forEach(el => {
                el.classList.remove('dragging');
            });
            this.draggedTask = null;
            this.dragOffset = { x: 0, y: 0 };
        });
    }
    
    // Get all employees for the current day
    getEmployeesForCurrentDay() {
        // Get global employees
        const globalEmployees = this.data.employees.filter(e => e.global);
        
        // Get day-specific employees for the current date
        const currentDateStr = this.getCurrentDateString();
        const daySpecificEmployees = this.data.daySpecificEmployees[currentDateStr] || [];
        
        // Combine and return
        return [...globalEmployees, ...daySpecificEmployees];
    }
    
    // Get current date as YYYY-MM-DD string
    getCurrentDateString() {
        const date = new Date(this.currentDate);
        return date.toISOString().split('T')[0];
    }
    
    // Update employee name
    updateEmployeeName(employeeId, newName) {
        // Check global employees
        const globalEmployee = this.data.employees.find(e => e.id === employeeId);
        if (globalEmployee) {
            globalEmployee.name = newName;
            this.saveData(); // Save data after updating employee name
            return;
        }
        
        // Check day-specific employees
        const currentDateStr = this.getCurrentDateString();
        const daySpecificEmployees = this.data.daySpecificEmployees[currentDateStr] || [];
        const dayEmployee = daySpecificEmployees.find(e => e.id === employeeId);
        if (dayEmployee) {
            dayEmployee.name = newName;
            this.saveData(); // Save data after updating employee name
        }
    }
    
    // Show delete employee modal
    showDeleteEmployeeModal(employee) {
        const modal = document.getElementById('delete-employee-modal');
        const employeeNameSpan = document.getElementById('employee-to-delete-name');
        const dayLabel = document.getElementById('delete-current-day-label');
        const confirmBtn = document.getElementById('confirm-delete-employee-btn');
        const cancelBtn = document.getElementById('cancel-delete-employee-btn');
        const closeBtn = document.querySelector('.close-delete-employee-modal');
        
        // Set employee name
        employeeNameSpan.textContent = employee.name;
        
        // Set current day label
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dayLabel.textContent = this.currentDate.toLocaleDateString('en-US', options);
        
        // Set up delete button
        const deleteHandler = () => {
            const deleteType = document.querySelector('input[name="delete-type"]:checked').value;
            
            if (deleteType === 'global') {
                // Delete from all days
                this.deleteEmployee(employee.id, true);
            } else {
                // Delete just from current day
                this.deleteEmployee(employee.id, false);
            }
            
            // Close modal
            modal.style.display = 'none';
            
            // Remove event listener
            confirmBtn.removeEventListener('click', deleteHandler);
        };
        
        confirmBtn.addEventListener('click', deleteHandler);
        
        // Set up cancel button
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Set up close button
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Show modal
        modal.style.display = 'block';
        
        // Close when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Delete employee
    deleteEmployee(employeeId, deleteGlobally) {
        // Remove tasks assigned to this employee
        this.data.scheduledTasks = this.data.scheduledTasks.filter(task => {
            if (deleteGlobally) {
                return task.employeeId !== employeeId;
            } else {
                // Only remove tasks for the current day
                const taskDate = new Date(task.startTime);
                const currentDate = new Date(this.currentDate);
                
                // Set both to midnight for comparison
                taskDate.setHours(0, 0, 0, 0);
                currentDate.setHours(0, 0, 0, 0);
                
                // Keep tasks that are either not for this employee or not on this day
                return task.employeeId !== employeeId || taskDate.getTime() !== currentDate.getTime();
            }
        });
        
        if (deleteGlobally) {
            // Remove from global employees
            this.data.employees = this.data.employees.filter(e => e.id !== employeeId);
            
            // Remove from all day-specific entries
            for (const dateKey in this.data.daySpecificEmployees) {
                this.data.daySpecificEmployees[dateKey] = this.data.daySpecificEmployees[dateKey].filter(
                    e => e.id !== employeeId
                );
            }
        } else {
            // Remove just from current day
            const currentDateStr = this.getCurrentDateString();
            
            if (this.data.daySpecificEmployees[currentDateStr]) {
                this.data.daySpecificEmployees[currentDateStr] = this.data.daySpecificEmployees[currentDateStr].filter(
                    e => e.id !== employeeId
                );
            }
            
            // If it's a global employee, hide it for this day by adding it to a "hidden" list
            const globalEmployee = this.data.employees.find(e => e.id === employeeId);
            if (globalEmployee) {
                if (!this.data.hiddenEmployees) {
                    this.data.hiddenEmployees = {};
                }
                
                if (!this.data.hiddenEmployees[currentDateStr]) {
                    this.data.hiddenEmployees[currentDateStr] = [];
                }
                
                this.data.hiddenEmployees[currentDateStr].push(employeeId);
            }
        }
        
        // Re-render the view
        if (this.currentView === 'daily') {
            this.renderDailyView();
        } else {
            this.renderWeeklyView();
        }
        
        // Save data after deleting an employee
        this.saveData();
    }
    
    // Save data to localStorage
    saveData() {
        try {
            // Save scheduled tasks
            localStorage.setItem('gantt_scheduledTasks', JSON.stringify(this.data.scheduledTasks));
            
            // Save employees (both global and day-specific)
            localStorage.setItem('gantt_employees', JSON.stringify(this.data.employees));
            localStorage.setItem('gantt_daySpecificEmployees', JSON.stringify(this.data.daySpecificEmployees));
            
            // Save products
            localStorage.setItem('gantt_products', JSON.stringify(this.data.products));
        } catch (e) {
            console.error('Error saving data to localStorage:', e);
        }
    }
    
    // Load saved data from localStorage
    loadSavedData() {
        try {
            // Load scheduled tasks
            const savedTasks = localStorage.getItem('gantt_scheduledTasks');
            if (savedTasks) {
                this.data.scheduledTasks = JSON.parse(savedTasks);
            }
            
            // Load employees
            const savedEmployees = localStorage.getItem('gantt_employees');
            if (savedEmployees) {
                this.data.employees = JSON.parse(savedEmployees);
            }
            
            // Load day-specific employees
            const savedDayEmployees = localStorage.getItem('gantt_daySpecificEmployees');
            if (savedDayEmployees) {
                this.data.daySpecificEmployees = JSON.parse(savedDayEmployees);
            }
            
            // Load products
            const savedProducts = localStorage.getItem('gantt_products');
            if (savedProducts) {
                this.data.products = JSON.parse(savedProducts);
            }
        } catch (e) {
            console.error('Error loading data from localStorage:', e);
        }
    }
    
    // Clear all application data from localStorage
    static clearAllData() {
        // Remove templates
        localStorage.removeItem('dayTemplates');
        
        // Remove any other data that might be stored
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('gantt_') || key.includes('template') || key.includes('task')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('All application data cleared from localStorage');
        return true;
    }
    
    // Clear all tasks for a specific day
    clearDay(date) {
        // Normalize the date to midnight for comparison
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        
        // Filter out tasks for the specified day
        this.data.scheduledTasks = this.data.scheduledTasks.filter(task => {
            const taskDate = new Date(task.startTime);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() !== targetDate.getTime();
        });
        
        console.log(`Cleared all tasks for ${targetDate.toDateString()}`);
        this.saveData(); // Save data after clearing a day
    }
    
    // Get all tasks visible in the current view
    getVisibleTasks() {
        if (this.currentView === 'daily') {
            // Get the current date being viewed
            const currentViewDate = new Date(this.currentDate);
            currentViewDate.setHours(0, 0, 0, 0);
            
            // Return all tasks for the current date
            return this.data.scheduledTasks.filter(task => {
                const taskDate = new Date(task.startTime);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate.getTime() === currentViewDate.getTime();
            });
        } else {
            // For weekly view, return all tasks for the current week
            const currentDate = new Date(this.currentDate);
            const dayOfWeek = currentDate.getDay();
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            
            return this.data.scheduledTasks.filter(task => {
                const taskDate = new Date(task.startTime);
                return taskDate >= startOfWeek && taskDate < endOfWeek;
            });
        }
    }
    
    // Helper methods
    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
        }
        return `${mins}m`;
    }
}
