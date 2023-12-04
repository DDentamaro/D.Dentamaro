import java.util.Scanner;

public class SumandProduct{
    public static int add(int a, int b) {
        return a + b;
    }

    public static int multiply(int a, int b) {
        return a * b;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Primo numero: ");
        int num1 = scanner.nextInt();

        System.out.print("Secondo numero: ");
        int num2 = scanner.nextInt();

        int sum = add(num1, num2);
        System.out.println("Somma: " + sum);

        int product = multiply(num1, num2);
        System.out.println("Prodotto: " + product);

        scanner.close();
    }
}