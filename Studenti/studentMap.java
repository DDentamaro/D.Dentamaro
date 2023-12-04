package Studenti;

import java.util.HashMap;
import java.util.Map;

public class studentMap {
    Map<String, Student> studentData;

    // Constructor
    public studentMap() {
        studentData = new HashMap<>();
    }

    // Method to add a student to the map
    public void addStudent(String key, Student student) {
        studentData.put(key, student);
    }

    // Method to remove a student from the map
    public void removeStudent(String key) {
        studentData.remove(key);
    }

    // Method to get a student from the map based on the key
    public Student getStudent(String key) {
        return studentData.get(key);
    }

    // Method to calculate the average GPA of all students in the map
    public double getAverageGPA() {
        if (studentData.isEmpty()) {
            return 0.0; // Return 0 if there are no students
        }

        double totalGPA = 0.0;
        for (Student student : studentData.values()) {
            totalGPA += student.gpa;
        }

        return totalGPA / studentData.size();
    }
}