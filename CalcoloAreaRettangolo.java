import java.util.Scanner;

public class CalcoloAreaRettangolo {
    public static double calculateRectangleArea(double length, double width) {
        // Calculate the area of the rectangle
        return length * width;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Get user input for the length of the rectangle
        System.out.print("Enter the length of the rectangle: ");
        double length = scanner.nextDouble();

        // Get user input for the width of the rectangle
        System.out.print("Enter the width of the rectangle: ");
        double width = scanner.nextDouble();

        // Call calculateRectangleArea with user-provided length and width values
        double calculatedArea = calculateRectangleArea(length, width);

        // Display the calculated area of the rectangle
        System.out.println("The area of the rectangle with length " + length + " and width " + width + " is: " + calculatedArea);

        scanner.close();
    }
}
