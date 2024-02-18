const showHelp = () => {
  console.log(`union server commands:`);
  console.log(`npx union                           - start the server`);
  console.log(
    `npx union [http port] [https port]  - start the server with different port numbers`
  );
  console.log(`npx union status                    - status of the server`);
  console.log(`npx union stop                      - stop the server`);
  console.log(
    `npx union lint                      - check configs and permissions`
  );
  console.log(``);
  console.log(
    `logs are stored in a directory called \`.union\`, which is located in whichever directory you were in
when you ran the start command.`
  );
};

export default showHelp;
