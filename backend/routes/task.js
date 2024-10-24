const express = require("express");
// Import the validation and creation middleware
require("dotenv").config();
const { validateTaskCreation, createTask,viewTasksByProject,validateAddAssignee,addAssignee,validateUpdateDeadline,updatedeadline } = require('../middlewares/TaskMiddlewares'); 

const router = express.Router();

router.post('/project/:project_id/create-task', validateTaskCreation, createTask);
router.get('/project/:project_id/view-tasks',viewTasksByProject);
router.post('/:task_id/add-assignee', validateAddAssignee, addAssignee);
router.put('/:task_id/update-deadline', validateUpdateDeadline,updatedeadline);

module.exports = router;