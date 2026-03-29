class HelloService {
  async sayHello(): Promise<string> {
    return 'Hello World!';
  }
}

export const helloService = new HelloService();
