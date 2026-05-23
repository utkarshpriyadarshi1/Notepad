import initSqlJs from 'sql.js';

// Inside your component setup
useEffect(() => {
  initSqlJs({ locateFile: file => `https://js.org{file}` }).then(SQL => {
    const db = new SQL.Database();
    db.run("CREATE TABLE tasks (id INT, text TEXT);");
    // Database is ready for relational local actions!
  });
}, []);
