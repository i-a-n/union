const showHelp = () => {
  console.log(`union server commands:
npx union                           - start the server
npx union [http port] [https port]  - start the server with different port numbers
npx union status                    - status of the server
npx union stop                      - stop the server
npx union lint                      - check configs and permissions

logs are stored in a directory called \`.union\`, which is located in whichever directory you were in
when you ran the start command.`);
};

export default showHelp;
