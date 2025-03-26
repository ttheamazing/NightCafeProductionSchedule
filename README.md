# Gantt Chart Scheduler Tool

A drag-and-drop Gantt chart scheduler tool for managing tasks and employees. This web-based application allows you to create and manage production schedules with a visual timeline interface.

![Gantt Chart Scheduler Screenshot](screenshot.png)

## Features

- **Daily View**: Detailed hourly grid for precise scheduling
- **Weekly View**: Overview of the entire week's schedule
- **Drag and Drop Interface**: Easily assign tasks to employees
- **Multiple Employee Timelines**: Manage schedules for your entire team
- **Visual Task Representation**: See task duration and timing at a glance
- **Day Templates**: Save and reuse common scheduling patterns
- **Print Functionality**: Generate printable schedules
- **Customizable UI**: Adjust colors and appearance to your preference

## Usage

1. Open `index.html` in a web browser
2. Use the "Daily View" or "Weekly View" buttons to switch between views
3. Drag tasks from the Product Area to the employee timelines
4. Tasks can be placed anywhere on the timeline (not just on the hour)
5. Tasks can be moved by dragging them to a new position
6. Right-click on tasks to access additional options

## Data Structure

The application uses a simple data structure:

- **Products**: Each product has a name and a list of tasks
- **Tasks**: Each task has a name and duration (in minutes)
- **Employees**: Each employee has a name and can be assigned tasks
- **Scheduled Tasks**: Represents a task assigned to an employee at a specific time

## Adding New Products and Tasks

- Click on a product name to add a new task to that product
- Click the "Add New Product" button to create a new product

## Managing Employees

- Click "Add New Employee" to create a new employee
- Employees can be global (available every day) or day-specific
- Click on an employee's name to rename them
- Use the delete button to remove an employee

## Day Templates

- Save common scheduling patterns as templates
- Apply templates to quickly set up recurring schedules
- Templates can be managed from the "Day Templates" button

## Browser Compatibility

This application works best in modern browsers such as:
- Chrome
- Firefox
- Safari
- Edge

## Installation

No installation required! Simply download the repository and open `index.html` in your web browser.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- Save/load functionality with backend integration
- Task dependencies and critical path visualization
- Resource allocation optimization
- Mobile-responsive design
