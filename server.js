const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const db = require('./db/db.js');

const HOST = 'localhost';
const PORT = 8000;

const timetableTemplate = fs.readFileSync(
  path.join(__dirname, 'templates', 'timetable.html'),
  'utf-8'
);

const myScheduleTemplate = fs.readFileSync(
  path.join(__dirname, 'templates', 'my-schedule.html'),
  'utf-8'
);

const errorTemplate = fs.readFileSync(
  path.join(__dirname, 'templates', 'error-404.html'),
  'utf-8'
);

function sendHTML(res, statusCode, content) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  res.end(content);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  const query = querystring.parse(parsedUrl.query || '');

  console.log(`Incoming request: ${req.method} ${req.url}`);

  if (req.method === 'GET' && pathname.startsWith('/assets/')) {
    const filePath = path.join(__dirname, pathname);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Static file error:', err);
        sendHTML(res, 404, errorTemplate);
        return;
      }

      let contentType = 'text/plain';
      if (filePath.endsWith('.css')) {
        contentType = 'text/css';
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });

    return;
  }
  
  if (
    req.method === 'GET' &&
    (pathname === '/' ||
      pathname === '/timetable' ||
      pathname === '/templates/timetable.html')
  ) {
    const sql = 'SELECT * FROM courses';

    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error loading courses:', err);
        sendHTML(res, 500, '<h1>Server error loading courses.</h1>');
        return;
      }

      let rows = '';

      results.forEach((course) => {
        rows += `
          <tr>
            <td>${course.course_code}</td>
            <td>${course.title}</td>
            <td>${course.instructor}</td>
            <td>${course.time}</td>
            <td>${course.location}</td>
            <td><a href="/add?course_id=${course.course_id}">Add</a></td>
          </tr>
        `;
      });

      if (!rows) {
        rows = '<tr><td colspan="6">No courses found.</td></tr>';
      }

      const page = timetableTemplate.replace('%_COURSE_ROWS_%', rows);
      sendHTML(res, 200, page);
    });

    return;
  }

  if (
    req.method === 'GET' &&
    (pathname === '/myschedule' ||
      pathname === '/templates/my-schedule.html')
  ) {
    const userId = 1;

    const sql = `
      SELECT
        c.course_id,
        c.course_code,
        c.title,
        c.instructor,
        c.time,
        c.location
      FROM user_schedule AS u
      JOIN courses AS c ON u.course_id = c.course_id
      WHERE u.user_id = ?
      ORDER BY c.course_code
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error('Error loading schedule:', err);
        sendHTML(res, 500, '<h1>Server error loading schedule.</h1>');
        return;
      }

      let rows = '';

      results.forEach((course) => {
        rows += `
          <tr>
            <td>${course.course_code}</td>
            <td>${course.title}</td>
            <td>${course.instructor}</td>
            <td>${course.time}</td>
            <td>${course.location}</td>
            <td><a href="/remove?course_id=${course.course_id}">Remove</a></td>
          </tr>
        `;
      });

      if (!rows) {
        rows = '<tr><td colspan="6">You have not added any courses yet.</td></tr>';
      }

      const page = myScheduleTemplate.replace('%_MY_ROWS_%', rows);
      sendHTML(res, 200, page);
    });

    return;
  }

  if (req.method === 'GET' && pathname === '/add') {
    const userId = 1;
    const courseId = parseInt(query.course_id, 10);

    if (isNaN(courseId) || courseId <= 0) {
      sendHTML(res, 400, errorTemplate);
      return;
    }

    const checkSql = 'SELECT * FROM courses WHERE course_id = ?';

    db.query(checkSql, [courseId], (err, results) => {
      if (err) {
        console.error('Error checking course:', err);
        sendHTML(res, 500, '<h1>Server error checking course.</h1>');
        return;
      }

      if (results.length === 0) {
        sendHTML(res, 404, errorTemplate);
        return;
      }

      const checkScheduleSql =
        'SELECT * FROM user_schedule WHERE user_id = ? AND course_id = ?';

      db.query(checkScheduleSql, [userId, courseId], (err, scheduleResults) => {
        if (err) {
          console.error('Error checking schedule:', err);
          sendHTML(res, 500, '<h1>Server error checking schedule.</h1>');
          return;
        }

        if (scheduleResults.length > 0) {
          redirect(res, '/timetable');
          return;
        }

        const insertSql =
          'INSERT INTO user_schedule (user_id, course_id) VALUES (?, ?)';

        db.query(insertSql, [userId, courseId], (err) => {
          if (err) {
            console.error('Error adding course:', err);
            sendHTML(res, 500, '<h1>Server error adding course.</h1>');
            return;
          }

          redirect(res, '/timetable');
        });
      });
    });

    return;
  }

  if (req.method === 'GET' && pathname === '/remove') {
    const userId = 1;
    const courseId = parseInt(query.course_id, 10);

    if (isNaN(courseId) || courseId <= 0) {
      sendHTML(res, 400, errorTemplate);
      return;
    }

    const deleteSql =
      'DELETE FROM user_schedule WHERE user_id = ? AND course_id = ?';

    db.query(deleteSql, [userId, courseId], (err, result) => {
      if (err) {
        console.error('Error removing course:', err);
        sendHTML(res, 500, '<h1>Server error removing course.</h1>');
        return;
      }

      redirect(res, '/myschedule');
    });

    return;
  }

  sendHTML(res, 404, errorTemplate);
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
