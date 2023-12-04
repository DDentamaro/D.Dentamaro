class StaticExercise {
    static int counter = 0;


    static {
        System.out.println("Static block is executed");
    }

    public static void incrementCounter() {
        counter++;
    }

    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            incrementCounter();
            System.out.println("Counter: " + counter);
        }
    }
}
