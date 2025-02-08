ToDo: 

- assistant 
- system logowania
- system wybierania modeli


ogs
Create a thread
POST/v1/threads
Response
{
"id":"thread_lVyHXOAAGeJwfx4ifEPWgbXV"
"object":"thread"
"created_at":1733922188
"metadata":{}
"tool_resources":{}
}
Add a message
POST/v1/threads/thread_lVyHXOAAGeJwfx4ifEPWgbXV/messages
Request
{
"role":"user"
"content":[...]
}
Response
{
"id":"msg_CvTrfO0CqmRjjfOagoqY6Fm7"
"object":"thread.message"
"created_at":1733922189
"assistant_id":NULL
"thread_id":"thread_lVyHXOAAGeJwfx4ifEPWgbXV"
"run_id":NULL
"role":"user"
"content":[...]
"attachments":[]
"metadata":{}
}
Run the thread
49 events
POST/v1/threads/thread_lVyHXOAAGeJwfx4ifEPWgbXV/runs
Request
{
"assistant_id":"asst_dSeMqYesehX6Hu8UWZVEKXww"
"additional_instructions":NULL
"tool_choice":NULL
}
Response stream
{
"data":{...}
"event":"thread.message.delta"
}
{
"data":{...}
"event":"thread.message.delta"
}
{
"data":{...}
"event":"thread.message.delta"
}
{
"data":{...}
"event":"thread.message.delta"
}
{
"data":{...}
"event":"thread.message.delta"
}
{
"data":{...}
"event":"thread.message.delta"
}
{
"data":{...}
"event":"thread.message.completed"
}
{
"data":{...}
"event":"thread.run.step.completed"
}
{
"data":{...}
"event":"thread.run.completed"