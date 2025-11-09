USE hackathon2;

DROP TABLE IF EXISTS user_schedule;
DROP TABLE IF EXISTS courses;

CREATE TABLE courses (
    course_id   INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(16)   NOT NULL,
    title       VARCHAR(100)  NOT NULL,
    instructor  VARCHAR(100)  NOT NULL,
    time        VARCHAR(50)   NOT NULL,
    location    VARCHAR(50)   NOT NULL
);

CREATE TABLE user_schedule (
    user_id   INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (user_id, course_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

INSERT INTO courses (course_code, title, instructor, time, location)
VALUES
('CSCI 1101', 'Intro to Computer Science',      'Dr. A',    'Mon 10:00–11:30', 'Room G101'),
('CSCI 1170', 'Web Design and Development',     'Dr. R',       'Tue 14:35–15:55', 'Room G202'),
('CSCI 2170', 'Intro to Server-Side Scripting', 'Dr. R', 'Wed 16:05–17:25', 'Room G303'),
('CSCI 2100', 'Data Structures',                'Dr. L', 'Thu 11:35–12:55', 'Room G404'),
('CSCI 1110', 'Intro to Programming (Java)',    'Dr. J',  'Fri 09:05–10:25', 'Room G505');

INSERT INTO user_schedule (user_id, course_id)
VALUES
(1, 1),
(1, 3);

SELECT * FROM courses;
SELECT * FROM user_schedule;