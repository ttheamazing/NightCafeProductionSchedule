# Gantt Chart Scheduler Tool

A drag-and-drop Gantt chart scheduler tool for managing tasks and employees.

## Features

- Daily view with hourly grid
- Weekly view with daily list
- Drag and drop tasks from product area to schedule
- Multiple employee timelines
- Visual representation of task duration

## Usage

1. Open `index.html` in a web browser
2. Use the "Daily View" or "Weekly View" buttons to switch between views
3. Drag tasks from the Product Area to the employee timelines
4. Tasks can be placed anywhere on the timeline (not just on the hour)
5. Tasks can be moved by dragging them to a new position

## Data Structure

The application uses a simple data structure:

- Products: Each product has a name and a list of tasks
- Tasks: Each task has a name and duration (in minutes)
- Employees: Each employee has a name and can be assigned tasks
- Scheduled Tasks: Represents a task assigned to an employee at a specific time

## Adding New Products and Tasks

- Click on a product name to add a new task to that product
- Click the "Add New Product" button to create a new product

## Future Enhancements

- Save/load functionality
- Multiple day scheduling
- Resource allocation visualization
- Task dependencies