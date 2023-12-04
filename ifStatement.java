import java.util.Scanner;

public class ifStatement {
    public static int checkNumber(int number) {
        if (number > 10) {
            return 1;
        } else {
            return 2;
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Get user input for the number
        System.out.print("inserisci un numero: ");
        int userNumber = scanner.nextInt();

        // Call the checkNumber function
        int result = checkNumber(userNumber);

        // Print the result
        System.out.println("Risultato: " + result);

        scanner.close();
    }
}