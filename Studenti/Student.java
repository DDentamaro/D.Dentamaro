package Studenti;
import java.util.Scanner;



class Student {
    String name;
    int age;
    double gpa;


    public Student(String name, int age, double gpa) {
        this.name = name;
        this.age = age;
        this.gpa = gpa;
    }



    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        studentMap studentMap = new studentMap();


        System.out.print("Enter the number of students: ");
        int numberOfStudents = scanner.nextInt();
        scanner.nextLine(); // Consume the newline character


        for (int i = 1; i <= numberOfStudents; i++) {
            System.out.println("Enter details for student " + i + ":");
            System.out.print("Name: ");
            String name = scanner.nextLine();
            System.out.print("Age: ");
            int age = scanner.nextInt();
            System.out.print("GPA: ");
            double gpa = scanner.nextDouble();
            scanner.nextLine();


            Student student = new Student(name, age, gpa);
            studentMap.addStudent("ID" + i, student);
        }


        System.out.print("Enter the ID of the student to remove: ");
        String studentToRemove = scanner.nextLine();
        studentMap.removeStudent(studentToRemove);


        System.out.print("Enter the ID of the student to retrieve: ");
        String studentToRetrieve = scanner.nextLine();
        Student retrievedStudent = studentMap.getStudent(studentToRetrieve);
        if (retrievedStudent != null) {
            System.out.println("Retrieved Student: " + retrievedStudent.name);
        } else {
            System.out.println("Student not found.");
        }


        double averageGPA = studentMap.getAverageGPA();
        System.out.println("Average GPA: " + averageGPA);

        scanner.close();
    }
}