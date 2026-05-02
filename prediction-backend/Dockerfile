# Giai đoạn 1: Dùng Maven để build code thành file .jar (Java 21)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Giai đoạn 2: Mang file .jar đi chạy (Java 21)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Mở cổng mặc định của Spring Boot
EXPOSE 8080
# Lệnh chạy Spring Boot
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-XX:MaxMetaspaceSize=128m", "-Xss512k", "-jar", "app.jar"]