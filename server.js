const http = require("http");
const fs = require("fs").promises;
const path = require("path");

const notespath = path.join(__dirname,"notes.json");

async function readNotes() {
    try{
        const notes = await fs.readFile(notespath,"utf8");
        return notes? JSON.parse(notes) :  [];
    }
    catch(error)
    {
        console.error("Error while reading the file",error);
        return [];
    }
    
}

async function writeNotes(notes) {
    await fs.writeFile(notespath,JSON.stringify(notes,null,2),"utf8");
    
}


const server = http.createServer(async(req,res)=>{
    console.log(`Incoming request :  ${req.method}${req.url}`);
   

    res.setHeader("Content-Type","application/json");
   
    if(req.url ==="/readnotes" && req.method ==="GET")
    {
        try{
        const notes = await readNotes();
        res.writeHead(200);
        res.end(JSON.stringify(notes));
          }

        catch(error)
         {
                res.writeHead(500);
                console.error(error);
                res.end(JSON.stringify({message:"Error while reading the file"}));
        }
        }

    else if(req.url === "/readnotes" && req.method === "POST")
    {
        try{
            let body = "";
            req.on("data",(chunk)=>(body+=chunk));

            req.on("end",async()=>{
                const {title,status} = JSON.parse(body);
                console.log(title,status);
                
                if(!title || status === undefined)
                {
                    res.writeHead(400);
                    return res.end(JSON.stringify({message:"Title and status should be present"}));

                }
                const notes = await readNotes();
                const existingnotes = notes.find((n)=>(n.title === title));
                if(existingnotes)
                {
                    res.writeHead(409);
                    return res.end(JSON.stringify({message:"Notes already exists"}));
                }
                
                notes.push({title,status});
                await writeNotes(notes);
                res.writeHead(201);
                res.end(JSON.stringify(notes));
            })


        }
        catch(error)
        {
            res.writeHead(500);
            console.error(error);
            res.end(JSON.stringify({message:"Error writing the file"}));
        }
    }
   else if(req.url.startsWith("/readnotes")  && req.method ==="DELETE")
   {
        
            try{
                const urlObj = new URL(req.url, `http://${req.headers.host}`);
                const title = urlObj.searchParams.get("title");
        
                console.log(`Extracted title: ${title}`); // Debugging
            if(!title){
                res.writeHead(400);
                return  res.end(JSON.stringify({message:"title is needed"}));
            }

            const notes = await readNotes();
            const filterednotes = notes.filter(n=>n.title !== title);

            if(notes.length === filterednotes.length)
            {
                res.writeHead(404);
               return  res.end(JSON.stringify({message:"note not found"}));
            }

            await writeNotes(filterednotes);
            res.writeHead(200);
            res.end(JSON.stringify({message:"Note deleted successfully"}));
        }
        catch(error)
        {
            res.writeHead(500);
            res.end(JSON.stringify({message:"Error while deleting the data"}));
        }

   }

        else{
            res.writeHead(404);
            res.end(JSON.stringify({message:"Route not found"}));
        }


});


server.listen(3001,()=>{
    console.log("Server is running at port 3001");
})

