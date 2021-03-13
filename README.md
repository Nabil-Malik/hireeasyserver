# HireEasyServer
#1 Register as a new user:
	url: localhost:3005/register
	request: POST
	
#2 Login:
	url: localhost:3005/register
	request: POST

#3 Update User Information
	url: localhost:3005/update
	request: POST
	
#4 Read Current User Information
    url: localhost:3005/user
	request: GET
	
#5 Read Current User Information
    url: localhost:3005/userlist
	request: GET
	
#6 Read Current User Information
    url: localhost:3005/msglist
	request: GET




## git comand
    1). create a local git repo
        Create .gitignore configuration
        git init
        git add *
        git commit -m "xxx"
    2). create github remote repo
        New Repository
        
    3). push local repo to remote repo
        git remote add origin  ****
        git push origin master
    
    4). push local repo update
        git add *
        git commit -m "xxx"
        git push origin master
    
    5). pull the latest remote git repo
            git pull origin master
            
    6). clone github repo
        git clone *****
## how to run the project
    1） check your mongdb has been set up;
	2) go to server repo foler to start the server side
		start a Terminal under the server folder;
		npm install
		npm start
	3)  go to client repo foler to start the client side
		start a Terminal under the client folder;
		npm install
		npm start
		
		
		

		

